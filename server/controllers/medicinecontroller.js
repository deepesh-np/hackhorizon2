const Medicine = require("../models/Medicine");
const Inventory = require("../models/Inventory");
const User = require("../models/User");

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

    res.status(200).json({
      success: true,
      medicine,
      pricing: {
        minPrice: stats.minPrice,
        maxPrice: stats.maxPrice,
        avgPrice: stats.avgPrice ? Math.round(stats.avgPrice * 100) / 100 : null,
        availableAt: stats.totalVendors,
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
      .sort({ isBranded: 1, averagePrice: 1 }) // generics first, then by price
      .limit(20);

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
};
