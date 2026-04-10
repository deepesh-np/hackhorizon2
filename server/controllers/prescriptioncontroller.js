const Groq = require("groq-sdk");
const Prescription = require("../models/Prescription");
const Medicine = require("../models/Medicine");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── @route   POST /api/prescriptions/scan ──────────────────────────────────
// @desc    Upload a prescription image → AI extracts medicines → returns analysis
// @access  Private (logged-in users)
const scanPrescription = async (req, res) => {
  try {
    const { image, imageUrl } = req.body;

    // Accept either base64 image or a URL
    const imageData = image || imageUrl;
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: "Please provide a prescription image (base64 'image' or 'imageUrl').",
      });
    }

    const startTime = Date.now();

    // Determine if it's base64 or URL
    const isBase64 = imageData.startsWith("data:image") || !imageData.startsWith("http");
    const imageContent = isBase64
      ? {
          type: "image_url",
          image_url: {
            url: imageData.startsWith("data:image")
              ? imageData
              : `data:image/jpeg;base64,${imageData}`,
          },
        }
      : {
          type: "image_url",
          image_url: { url: imageData },
        };

    // Call Groq Vision model to extract prescription data
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: `You are a medical prescription analysis AI. Extract all medicine information from prescription images.
          
Return your response ONLY as valid JSON with this exact structure:
{
  "extractedText": "full raw text visible in the prescription",
  "medicines": [
    {
      "name": "medicine name as written",
      "dosage": "dosage/strength (e.g., 500mg)",
      "frequency": "how often to take (e.g., twice a day)",
      "duration": "for how long (e.g., 7 days)",
      "instructions": "any special instructions (e.g., after meals)"
    }
  ],
  "doctorInfo": {
    "name": "doctor name if readable",
    "registrationNumber": "registration number if visible",
    "hospital": "hospital/clinic name if visible"
  },
  "patientInfo": {
    "name": "patient name if readable",
    "age": "patient age if visible",
    "diagnosis": "diagnosis if mentioned"
  }
}

Rules:
- Extract ALL medicines mentioned, even partial names
- If a field is not readable, use null
- Dosage should include strength (mg, ml, etc.)
- Be as accurate as possible with medicine names
- Do NOT include any text outside the JSON object`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this prescription image and extract all medicine details:",
            },
            imageContent,
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({
        success: false,
        message: "AI could not process the prescription image.",
      });
    }

    // Parse AI response
    let parsed;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("AI response parse error:", parseErr, "\nRaw:", aiResponse);
      return res.status(500).json({
        success: false,
        message: "Could not parse AI response. Please try again with a clearer image.",
        rawResponse: aiResponse,
      });
    }

    // Try to match extracted medicine names to our DB
    const medicinesWithMatches = await Promise.all(
      (parsed.medicines || []).map(async (med) => {
        let matchedMedicine = null;

        if (med.name) {
          // Try exact match first, then fuzzy
          const searchRegex = new RegExp(med.name.trim(), "i");
          const dbMatch = await Medicine.findOne({
            isActive: true,
            $or: [
              { name: searchRegex },
              { genericName: searchRegex },
              { brand: searchRegex },
            ],
          }).select("_id name genericName brand therapeuticCategory dosageForm averagePrice");

          matchedMedicine = dbMatch || null;
        }

        return {
          name: med.name,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          duration: med.duration || null,
          instructions: med.instructions || null,
          matchedMedicine: matchedMedicine?._id || null,
          matchedDetails: matchedMedicine || null,
        };
      })
    );

    const processingTime = Date.now() - startTime;

    // Save prescription to DB
    const prescription = await Prescription.create({
      user: req.user._id,
      originalImage: isBase64 ? "[base64_image]" : imageData, // Don't store large base64 in DB
      extractedText: parsed.extractedText || "",
      extractedMedicines: medicinesWithMatches.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
        matchedMedicine: m.matchedMedicine,
      })),
      doctorInfo: parsed.doctorInfo || {},
      patientInfo: parsed.patientInfo || {},
      status: medicinesWithMatches.length > 0 ? "completed" : "partial",
      processingTime,
    });

    // For matched medicines, also fetch alternatives summary
    const medicinesAnalysis = await Promise.all(
      medicinesWithMatches.map(async (med) => {
        const analysis = { ...med };

        if (med.matchedMedicine) {
          // Count available alternatives
          const dbMed = await Medicine.findById(med.matchedMedicine);
          if (dbMed) {
            const ingredientNames = dbMed.activeIngredients?.map((i) => i.name) || [];
            const altCount = await Medicine.countDocuments({
              _id: { $ne: dbMed._id },
              isActive: true,
              $or: [
                { genericName: { $regex: new RegExp(`^${dbMed.genericName}$`, "i") } },
                { "activeIngredients.name": { $in: ingredientNames } },
              ],
            });
            analysis.alternativesAvailable = altCount;
          }
        }

        return analysis;
      })
    );

    res.status(200).json({
      success: true,
      message: "Prescription analyzed successfully.",
      prescriptionId: prescription._id,
      processingTime: `${processingTime}ms`,
      extractedText: parsed.extractedText || null,
      doctorInfo: parsed.doctorInfo || null,
      patientInfo: parsed.patientInfo || null,
      medicines: medicinesAnalysis,
      totalMedicinesFound: medicinesAnalysis.length,
      matchedInDatabase: medicinesAnalysis.filter((m) => m.matchedMedicine).length,
    });
  } catch (error) {
    console.error("ScanPrescription error:", error);

    if (error.status === 401 || error.message?.includes("API key")) {
      return res.status(503).json({
        success: false,
        message: "AI service authentication failed. Check GROQ_API_KEY.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Could not process prescription. Please try again.",
    });
  }
};

// ─── @route   POST /api/prescriptions/analyze-text ──────────────────────────
// @desc    Analyze a medicine name or text input (no image needed)
// @access  Private
const analyzeText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please provide a medicine name or prescription text.",
      });
    }

    const startTime = Date.now();

    // Use Groq to parse and identify medicines from free text
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: `You are a medical expert. Given a medicine name or prescription text, identify all medicines mentioned and provide structured info.

Return ONLY valid JSON:
{
  "medicines": [
    {
      "name": "medicine name",
      "genericName": "generic/salt name if known",
      "dosage": "dosage if mentioned",
      "therapeuticCategory": "category (e.g., Antibiotic, Analgesic)",
      "commonUses": "what it's commonly used for",
      "dosageForm": "Tablet/Capsule/Syrup etc."
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Analyze this medicine/prescription text: "${text}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    let parsed;

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      return res.status(500).json({
        success: false,
        message: "Could not parse AI response.",
      });
    }

    // Match with DB
    const results = await Promise.all(
      (parsed.medicines || []).map(async (med) => {
        const searchRegex = new RegExp(med.name?.trim() || text.trim(), "i");
        const dbMatches = await Medicine.find({
          isActive: true,
          $or: [
            { name: searchRegex },
            { genericName: searchRegex },
            { brand: searchRegex },
          ],
        })
          .select("name genericName brand manufacturer dosageForm therapeuticCategory averagePrice isBranded packSize regulatoryApproval activeIngredients")
          .limit(5);

        return {
          aiAnalysis: med,
          databaseMatches: dbMatches,
          matchCount: dbMatches.length,
        };
      })
    );

    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      processingTime: `${processingTime}ms`,
      query: text,
      results,
    });
  } catch (error) {
    console.error("AnalyzeText error:", error);
    res.status(500).json({ success: false, message: "Could not analyze text." });
  }
};

// ─── @route   GET /api/prescriptions/history ────────────────────────────────
// @desc    Get the logged-in user's prescription scan history
// @access  Private
const getPrescriptionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Prescription.countDocuments({ user: req.user._id });

    const prescriptions = await Prescription.find({ user: req.user._id })
      .populate("extractedMedicines.matchedMedicine", "name genericName brand averagePrice")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select("-originalImage"); // Don't send large image data

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      prescriptions,
    });
  } catch (error) {
    console.error("GetPrescriptionHistory error:", error);
    res.status(500).json({ success: false, message: "Could not fetch scan history." });
  }
};

// ─── @route   GET /api/prescriptions/:id ────────────────────────────────────
// @desc    Get a specific prescription scan result
// @access  Private (owner only)
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate(
      "extractedMedicines.matchedMedicine",
      "name genericName brand manufacturer averagePrice dosageForm therapeuticCategory activeIngredients equivalentMedicines"
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found.",
      });
    }

    res.status(200).json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error("GetPrescriptionById error:", error);
    res.status(500).json({ success: false, message: "Could not fetch prescription." });
  }
};

module.exports = {
  scanPrescription,
  analyzeText,
  getPrescriptionHistory,
  getPrescriptionById,
};
