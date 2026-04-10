const Medicine = require("../models/Medicine");
const Inventory = require("../models/Inventory");
const User = require("../models/User");
const { callGroqWithFallback, textModels } = require("../utils/groqClient");

const SCRAPPER_URL = process.env.SCRAPPER_URL || "http://localhost:8000";

// ─── @route   GET /api/medicines/search ─────────────────────────────────────
// @desc    Search medicines by name, generic name, or active ingredient
// @access  Public
const searchMedicines = async (req, res) => {
  try {
    const { q, category, dosageForm, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

    const query = { isActive: true };

    // Use text search if available, otherwise regex fallback
    const searchRegex = new RegExp(q.trim(), "i");
    query.$or = [
      { name: searchRegex },
      { genericName: searchRegex },
      { "activeIngredients.name": searchRegex },
      { brand: searchRegex },
      { manufacturer: searchRegex },
    ];

    if (category) query.therapeuticCategory = category;
    if (dosageForm) query.dosageForm = dosageForm;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Medicine.countDocuments(query);

    const medicines = await Medicine.find(query)
      .select("name genericName brand manufacturer dosageForm therapeuticCategory averagePrice isBranded prescriptionRequired packSize activeIngredients regulatoryApproval")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    // For each medicine, get the lowest price from inventory
    const medicinesWithPricing = await Promise.all(
      medicines.map(async (med) => {
        const cheapestInventory = await Inventory.findOne({
          medicine: med._id,
          inStock: true,
        })
          .sort({ price: 1 })
          .select("price mrp discount");

        return {
          ...med.toObject(),
          isCurrentlyAvailable: !!cheapestInventory,
          availabilityStatus: cheapestInventory ? "available" : "currently not available",
          lowestPrice: cheapestInventory?.price || med.averagePrice || null,
          mrp: cheapestInventory?.mrp || null,
          discount: cheapestInventory?.discount || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: medicinesWithPricing.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      medicines: medicinesWithPricing,
    });
  } catch (error) {
    console.error("SearchMedicines error:", error);
    res.status(500).json({ success: false, message: "Could not search medicines." });
  }
};

// ─── @route   GET /api/medicines/:id ────────────────────────────────────────
// @desc    Get full medicine details with structured analysis
// @access  Public
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate("equivalentMedicines", "name genericName brand manufacturer dosageForm averagePrice isBranded packSize")
      .populate("addedBy", "name");

    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    // Get price range from inventory
    const inventoryStats = await Inventory.aggregate([
      { $match: { medicine: medicine._id, inStock: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
          totalVendors: { $sum: 1 },
        },
      },
    ]);

    const stats = inventoryStats[0] || { minPrice: null, maxPrice: null, avgPrice: null, totalVendors: 0 };

    // ── AI-powered alternatives (Groq) with DB fallback ──
    let aiAlternativeNames = [];
    let alternativesSource = "database";

    try {
      const ingredientList = (medicine.activeIngredients || []).map((i) => `${i.name} ${i.strength || ""}`).join(", ");

      const chatCompletion = await callGroqWithFallback({
        messages: [
          {
            role: "system",
            content: `You are an Indian pharmaceutical expert. Given a medicine, list ALL known alternative brands and generics available in India.

Return ONLY valid JSON:
{
  "alternatives": [
    {
      "name": "brand name with strength",
      "genericName": "salt/generic name",
      "manufacturer": "company name",
      "isBranded": true,
      "estimatedPrice": 25,
      "dosageForm": "Tablet"
    }
  ]
}

Rules:
- Include at least 10-15 alternatives if they exist
- Include both branded and generic/Jan Aushadhi options
- Include the generic/salt name accurately
- estimatedPrice should be approximate MRP in INR
- Do NOT include the original medicine itself
- Do NOT include any text outside the JSON object`,
          },
          {
            role: "user",
            content: `List all Indian market alternatives for: "${medicine.name}" (Generic: ${medicine.genericName}, Active: ${ingredientList}, Category: ${medicine.therapeuticCategory}, Form: ${medicine.dosageForm})`,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }, textModels);

      const aiResponse = chatCompletion.choices[0]?.message?.content;
      if (aiResponse) {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiAlternativeNames = parsed.alternatives || [];
          alternativesSource = "ai+database";
          console.log(`AI returned ${aiAlternativeNames.length} alternatives for ${medicine.name}`);
        }
      }
    } catch (aiError) {
      console.warn("AI alternatives lookup failed, falling back to database:", aiError.message);
    }

    // ── Fetch DB alternatives (always — this is the fallback baseline) ──
    const ingredientNames = medicine.activeIngredients?.map((i) => i.name) || [];

    const dbAlternatives = await Medicine.find({
      _id: { $ne: medicine._id },
      isActive: true,
      $or: [
        { _id: { $in: medicine.equivalentMedicines || [] } },
        ...(medicine.genericName
          ? [{ genericName: { $regex: new RegExp(`^${medicine.genericName}$`, "i") } }]
          : []),
        ...(ingredientNames.length > 0
          ? [{ "activeIngredients.name": { $in: ingredientNames } }]
          : []),
      ],
    })
      .select("name genericName brand manufacturer dosageForm averagePrice isBranded packSize regulatoryApproval activeIngredients")
      .sort({ isBranded: 1, averagePrice: 1 });

    // ── Save AI suggestions to DB & merge ──
    const dbNames = new Set(dbAlternatives.map((d) => d.name.toLowerCase()));
    const validCategories = ["Antibiotic","Antifungal","Antiviral","Analgesic","Antipyretic","Antihypertensive","Antidiabetic","Antidepressant","Antihistamine","Antacid","Cardiovascular","Respiratory","Gastrointestinal","Neurological","Hormonal","Vitamin/Supplement","Other"];
    const validForms = ["Tablet","Capsule","Syrup","Injection","Cream","Drops","Inhaler","Patch","Gel","Ointment","Powder","Suspension","Other"];

    const newAiAlts = aiAlternativeNames.filter((ai) => ai.name && !dbNames.has(ai.name.toLowerCase()));

    // Save AI alternatives to DB so they get _id and become clickable
    const savedAiIds = [];
    for (const ai of newAiAlts) {
      try {
        const category = validCategories.includes(ai.therapeuticCategory) ? ai.therapeuticCategory : (medicine.therapeuticCategory || "Other");
        const form = validForms.includes(ai.dosageForm) ? ai.dosageForm : (medicine.dosageForm || "Other");

        const saved = await Medicine.findOneAndUpdate(
          { name: ai.name },
          {
            $setOnInsert: {
              name: ai.name,
              genericName: ai.genericName || medicine.genericName,
              brand: ai.name?.split(" ")[0] || "Unknown",
              manufacturer: ai.manufacturer || "Unknown",
              dosageForm: form,
              therapeuticCategory: category,
              averagePrice: ai.estimatedPrice || 0,
              isBranded: ai.isBranded !== false,
              activeIngredients: medicine.activeIngredients || [],
              description: ai.description || `Alternative to ${medicine.name} with the same active ingredient ${medicine.genericName}.`,
              sideEffects: medicine.sideEffects || [],
              regulatoryApproval: { approvedBy: "CDSCO", isApproved: true },
              isActive: true,
            },
          },
          { upsert: true, new: true }
        );
        savedAiIds.push(saved._id);
      } catch (saveErr) {
        console.warn(`Could not save AI alt "${ai.name}":`, saveErr.message);
      }
    }

    // Re-fetch saved AI alternatives from DB so they have full schema + _id
    let aiDbAlternatives = [];
    if (savedAiIds.length > 0) {
      aiDbAlternatives = await Medicine.find({ _id: { $in: savedAiIds } })
        .select("name genericName brand manufacturer dosageForm averagePrice isBranded packSize regulatoryApproval activeIngredients description sideEffects");
    }

    // Enrich AI-from-DB alternatives with availability
    const enrichedAi = await Promise.all(
      aiDbAlternatives.map(async (alt) => {
        const cheapest = await Inventory.findOne({ medicine: alt._id, inStock: true })
          .sort({ price: 1 }).select("price mrp discount");
        const altObj = alt.toObject();
        altObj.isCurrentlyAvailable = !!cheapest;
        altObj.availabilityStatus = cheapest ? "available" : "currently not available";
        altObj.lowestPrice = cheapest?.price || alt.averagePrice || null;
        altObj.mrp = cheapest?.mrp || null;
        altObj.discount = cheapest?.discount || 0;
        return altObj;
      })
    );

    // ── Enrich DB alternatives with availability + pricing ──
    const enrichedDb = await Promise.all(
      dbAlternatives.map(async (alt) => {
        const cheapest = await Inventory.findOne({
          medicine: alt._id,
          inStock: true,
        })
          .sort({ price: 1 })
          .select("price mrp discount");

        const altObj = alt.toObject();
        altObj.isCurrentlyAvailable = !!cheapest;
        altObj.availabilityStatus = cheapest ? "available" : "currently not available";
        altObj.lowestPrice = cheapest?.price || alt.averagePrice || null;
        altObj.mrp = cheapest?.mrp || null;
        altObj.discount = cheapest?.discount || 0;
        altObj.isFromAI = false;

        // Calculate savings vs original
        if (medicine.averagePrice && altObj.lowestPrice) {
          altObj.savings = Math.round((medicine.averagePrice - altObj.lowestPrice) * 100) / 100;
          altObj.savingsPercent =
            Math.round(((medicine.averagePrice - altObj.lowestPrice) / medicine.averagePrice) * 10000) / 100;
        }

        return altObj;
      })
    );

    // ── Combine: DB results first, then AI-saved suggestions ──
    const allAlternatives = [...enrichedDb, ...enrichedAi];

    // Add savings for all alternatives
    for (const alt of allAlternatives) {
      if (medicine.averagePrice && alt.lowestPrice && alt.savings === undefined) {
        alt.savings = Math.round((medicine.averagePrice - alt.lowestPrice) * 100) / 100;
        alt.savingsPercent =
          Math.round(((medicine.averagePrice - alt.lowestPrice) / medicine.averagePrice) * 10000) / 100;
      }
    }

    // Sort: available first, then by price ascending
    allAlternatives.sort((a, b) => {
      if (a.isCurrentlyAvailable !== b.isCurrentlyAvailable) {
        return a.isCurrentlyAvailable ? -1 : 1;
      }
      return (a.lowestPrice || Infinity) - (b.lowestPrice || Infinity);
    });

    const generics = allAlternatives.filter((a) => !a.isBranded);
    const branded = allAlternatives.filter((a) => a.isBranded);

    res.status(200).json({
      success: true,
      medicine,
      pricing: {
        minPrice: stats.minPrice,
        maxPrice: stats.maxPrice,
        avgPrice: stats.avgPrice ? Math.round(stats.avgPrice * 100) / 100 : null,
        availableAt: stats.totalVendors,
      },
      alternatives: {
        source: alternativesSource,
        totalAlternatives: allAlternatives.length,
        generics: { count: generics.length, medicines: generics },
        brandedAlternatives: { count: branded.length, medicines: branded },
      },
    });
  } catch (error) {
    console.error("GetMedicineById error:", error);
    res.status(500).json({ success: false, message: "Could not fetch medicine details." });
  }
};

// ─── @route   GET /api/medicines/:id/alternatives ───────────────────────────
// @desc    Get generic alternatives & cheaper branded equivalents
// @access  Public
const getAlternatives = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    // Strategy 1: Use the equivalentMedicines field (manually curated)
    // Strategy 2: Find same genericName medicines (automatic matching)
    // Strategy 3: Find medicines with same activeIngredients

    const ingredientNames = medicine.activeIngredients.map((i) => i.name);

    const alternatives = await Medicine.find({
      _id: { $ne: medicine._id },
      isActive: true,
      $or: [
        { _id: { $in: medicine.equivalentMedicines } },
        { genericName: { $regex: new RegExp(`^${medicine.genericName}$`, "i") } },
        { "activeIngredients.name": { $in: ingredientNames } },
      ],
    })
      .select("name genericName brand manufacturer dosageForm averagePrice isBranded packSize regulatoryApproval activeIngredients")
      .sort({ isBranded: 1, averagePrice: 1 }); // generics first, then by price

    // Enrich with actual lowest price from inventory
    const enriched = await Promise.all(
      alternatives.map(async (alt) => {
        const cheapest = await Inventory.findOne({
          medicine: alt._id,
          inStock: true,
        })
          .sort({ price: 1 })
          .select("price mrp discount");

        const altObj = alt.toObject();
        altObj.isCurrentlyAvailable = !!cheapest;
        altObj.availabilityStatus = cheapest ? "available" : "currently not available";
        altObj.lowestPrice = cheapest?.price || alt.averagePrice || null;
        altObj.mrp = cheapest?.mrp || null;
        altObj.discount = cheapest?.discount || 0;

        // Calculate savings vs original
        if (medicine.averagePrice && altObj.lowestPrice) {
          altObj.savings = Math.round((medicine.averagePrice - altObj.lowestPrice) * 100) / 100;
          altObj.savingsPercent =
            Math.round(((medicine.averagePrice - altObj.lowestPrice) / medicine.averagePrice) * 10000) / 100;
        }

        return altObj;
      })
    );

    // Sort: available first, then by price ascending
    enriched.sort((a, b) => {
      if (a.isCurrentlyAvailable !== b.isCurrentlyAvailable) {
        return a.isCurrentlyAvailable ? -1 : 1;
      }
      return (a.lowestPrice || Infinity) - (b.lowestPrice || Infinity);
    });

    // Separate into generics and branded alternatives
    const generics = enriched.filter((a) => !a.isBranded);
    const branded = enriched.filter((a) => a.isBranded);

    res.status(200).json({
      success: true,
      originalMedicine: {
        name: medicine.name,
        brand: medicine.brand,
        genericName: medicine.genericName,
        averagePrice: medicine.averagePrice,
      },
      generics: { count: generics.length, medicines: generics },
      brandedAlternatives: { count: branded.length, medicines: branded },
      totalAlternatives: enriched.length,
    });
  } catch (error) {
    console.error("GetAlternatives error:", error);
    res.status(500).json({ success: false, message: "Could not fetch alternatives." });
  }
};

// ─── @route   GET /api/medicines/:id/prices ─────────────────────────────────
// @desc    Price comparison across all vendors for a specific medicine
// @access  Public
const getPriceComparison = async (req, res) => {
  try {
    const { sortBy = "price", order = "asc" } = req.query;

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    const sortOrder = order === "desc" ? -1 : 1;

    const inventoryItems = await Inventory.find({
      medicine: medicine._id,
      inStock: true,
    })
      .populate({
        path: "vendor",
        select: "name vendorDetails.pharmacyName vendorDetails.address vendorDetails.location vendorDetails.isVerified",
        match: { isActive: true, "vendorDetails.isVerified": true },
      })
      .sort({ [sortBy]: sortOrder });

    // Filter out items where vendor didn't match (inactive/unverified)
    const validItems = inventoryItems.filter((item) => item.vendor !== null);

    const priceList = validItems.map((item) => ({
      vendorId: item.vendor._id,
      pharmacyName: item.vendor.vendorDetails?.pharmacyName || item.vendor.name,
      address: item.vendor.vendorDetails?.address || {},
      price: item.price,
      mrp: item.mrp,
      discount: item.discount,
      stock: item.stock,
      expiryDate: item.expiryDate,
      lastUpdated: item.lastUpdated,
    }));

    res.status(200).json({
      success: true,
      medicine: {
        name: medicine.name,
        genericName: medicine.genericName,
        brand: medicine.brand,
        packSize: medicine.packSize,
      },
      priceComparison: {
        count: priceList.length,
        vendors: priceList,
        cheapest: priceList[0] || null,
        mostExpensive: priceList[priceList.length - 1] || null,
      },
    });
  } catch (error) {
    console.error("GetPriceComparison error:", error);
    res.status(500).json({ success: false, message: "Could not fetch price comparison." });
  }
};

// ─── @route   GET /api/medicines/:id/pharmacies ─────────────────────────────
// @desc    Find nearby pharmacies stocking this medicine
// @access  Public
const getNearbyPharmacies = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude (lat) and longitude (lng) are required.",
      });
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    // Find inventory entries for this medicine
    const inventoryItems = await Inventory.find({
      medicine: medicine._id,
      inStock: true,
    }).select("vendor price mrp discount stock expiryDate");

    const vendorIds = inventoryItems.map((i) => i.vendor);

    // Geo query to find nearby vendors who stock this medicine
    const radiusInMeters = parseFloat(radius) * 1000;

    const nearbyVendors = await User.find({
      _id: { $in: vendorIds },
      isActive: true,
      role: "vendor",
      "vendorDetails.isVerified": true,
      "vendorDetails.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).select("name vendorDetails.pharmacyName vendorDetails.address vendorDetails.location phone");

    // Merge vendor data with inventory data
    const pharmacies = nearbyVendors.map((vendor) => {
      const inventory = inventoryItems.find(
        (i) => i.vendor.toString() === vendor._id.toString()
      );

      // Calculate approximate distance
      const vendorCoords = vendor.vendorDetails?.location?.coordinates;
      let distance = null;
      if (vendorCoords && vendorCoords[0] !== 0 && vendorCoords[1] !== 0) {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          vendorCoords[1],
          vendorCoords[0]
        );
      }

      return {
        vendorId: vendor._id,
        pharmacyName: vendor.vendorDetails?.pharmacyName || vendor.name,
        phone: vendor.phone,
        address: vendor.vendorDetails?.address || {},
        coordinates: vendorCoords || null,
        distance: distance ? Math.round(distance * 100) / 100 : null,
        distanceUnit: "km",
        price: inventory?.price || null,
        mrp: inventory?.mrp || null,
        discount: inventory?.discount || 0,
        stock: inventory?.stock || 0,
        expiryDate: inventory?.expiryDate || null,
      };
    });

    // Sort by distance
    pharmacies.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

    res.status(200).json({
      success: true,
      medicine: { name: medicine.name, genericName: medicine.genericName },
      searchRadius: `${radius} km`,
      pharmacies: { count: pharmacies.length, list: pharmacies },
    });
  } catch (error) {
    console.error("GetNearbyPharmacies error:", error);
    // If geo index is not set up, provide fallback
    if (error.code === 291 || error.codeName === "NoQueryExecutionPlans") {
      return res.status(200).json({
        success: true,
        medicine: { name: "N/A" },
        searchRadius: `${req.query.radius || 10} km`,
        pharmacies: { count: 0, list: [] },
        note: "Geospatial index not yet populated. Add vendor locations to enable nearby search.",
      });
    }
    res.status(500).json({ success: false, message: "Could not find nearby pharmacies." });
  }
};

// ─── @route   GET /api/medicines/info ────────────────────────────────────────
// @desc    Proxy to Python scrapper for detailed drug information
// @access  Public
const getDrugInfo = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Drug info URL is required. Provide a valid drug page URL.",
      });
    }

    const response = await fetch(`${SCRAPPER_URL}/scrape?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Could not fetch drug info from external source.",
      });
    }

    const drugInfo = await response.json();

    res.status(200).json({
      success: true,
      source: "external",
      drugInfo,
    });
  } catch (error) {
    console.error("GetDrugInfo error:", error);
    res.status(503).json({
      success: false,
      message: "Drug info service unavailable. Make sure the scrapper is running.",
    });
  }
};

// ─── Helper: Haversine distance calculation ──────────────────────────────────
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ─── @route   POST /api/medicines (Admin) ───────────────────────────────────
// @desc    Add a new medicine to the catalog
// @access  Admin only
const addMedicine = async (req, res) => {
  try {
    const {
      name,
      genericName,
      activeIngredients,
      therapeuticCategory,
      dosageForm,
      description,
      sideEffects,
      contraindications,
      warnings,
      packSize,
      storageInstructions,
      manufacturer,
      brand,
      isBranded,
      averagePrice,
      regulatoryApproval,
      prescriptionRequired,
      equivalentMedicines,
    } = req.body;

    const medicine = await Medicine.create({
      name,
      genericName,
      activeIngredients,
      therapeuticCategory,
      dosageForm,
      description,
      sideEffects,
      contraindications,
      warnings,
      packSize,
      storageInstructions,
      manufacturer,
      brand,
      isBranded,
      averagePrice,
      regulatoryApproval,
      prescriptionRequired,
      equivalentMedicines,
      addedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Medicine added successfully.",
      medicine,
    });
  } catch (error) {
    console.error("AddMedicine error:", error);
    res.status(500).json({ success: false, message: "Could not add medicine." });
  }
};

// ─── @route   PUT /api/medicines/:id (Admin) ────────────────────────────────
// @desc    Update a medicine in the catalog
// @access  Admin only
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully.",
      medicine,
    });
  } catch (error) {
    console.error("UpdateMedicine error:", error);
    res.status(500).json({ success: false, message: "Could not update medicine." });
  }
};

// ─── @route   DELETE /api/medicines/:id (Admin) ─────────────────────────────
// @desc    Soft-delete a medicine
// @access  Admin only
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    res.status(200).json({
      success: true,
      message: "Medicine deactivated successfully.",
    });
  } catch (error) {
    console.error("DeleteMedicine error:", error);
    res.status(500).json({ success: false, message: "Could not delete medicine." });
  }
};

// ─── @route   GET /api/medicines/:id/compare/:altId ─────────────────────────
// @desc    AI-powered comparison: why switch (or not) from original to alternative
// @access  Public
const compareMedicines = async (req, res) => {
  try {
    const original = await Medicine.findById(req.params.id);
    const alternative = await Medicine.findById(req.params.altId);

    if (!original || !alternative) {
      return res.status(404).json({ success: false, message: "One or both medicines not found." });
    }

    const origIngredients = (original.activeIngredients || []).map((i) => `${i.name} ${i.strength || ""}`).join(", ");
    const altIngredients = (alternative.activeIngredients || []).map((i) => `${i.name} ${i.strength || ""}`).join(", ");

    const chatCompletion = await callGroqWithFallback({
      messages: [
        {
          role: "system",
          content: `You are a factual pharmaceutical expert. Compare two medicines by stating ONLY short facts and proper chemical compositions. Provide valid individual government links for both medicines.

Return ONLY valid JSON:
{
  "summary": "Short factual summary",
  "originalComposition": "Chemical composition of the first",
  "alternativeComposition": "Chemical composition of the second",
  "facts": ["Short Fact 1", "Short Fact 2"],
  "originalGovLink": "A reliable .gov link (like MedlinePlus or PubChem) for the first medicine",
  "alternativeGovLink": "A reliable .gov link for the second medicine"
}

Rules:
- Keep facts very brief (1 sentence max each).
- State proper chemical compositions accurately.
- Do not provide advice. Just state facts.
- Provide two valid government links.
- Do NOT include any text outside the JSON`,
        },
        {
          role: "user",
          content: `Compare switching FROM "${original.name}" (Generic: ${original.genericName}, Active: ${origIngredients}, Category: ${original.therapeuticCategory}, Price: ₹${original.averagePrice}, Manufacturer: ${original.manufacturer}) TO "${alternative.name}" (Generic: ${alternative.genericName}, Active: ${altIngredients}, Category: ${alternative.therapeuticCategory}, Price: ₹${alternative.averagePrice}, Manufacturer: ${alternative.manufacturer})`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }, textModels);

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    let comparison = null;

    if (aiResponse) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        comparison = JSON.parse(jsonMatch[0]);
      }
    }

    res.status(200).json({
      success: true,
      original: { _id: original._id, name: original.name, genericName: original.genericName, averagePrice: original.averagePrice },
      alternative: { _id: alternative._id, name: alternative.name, genericName: alternative.genericName, averagePrice: alternative.averagePrice },
      comparison,
    });
  } catch (error) {
    console.error("CompareMedicines error:", error);
    res.status(500).json({ success: false, message: "Could not generate comparison.", comparison: null });
  }
};

module.exports = {
  searchMedicines,
  getMedicineById,
  getAlternatives,
  getPriceComparison,
  getNearbyPharmacies,
  getDrugInfo,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  compareMedicines,
};
