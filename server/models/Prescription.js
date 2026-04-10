const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Original uploaded image (base64 or URL)
    originalImage: {
      type: String,
      required: true,
    },
    // Raw text extracted by AI from the prescription
    extractedText: {
      type: String,
    },
    // Structured list of medicines extracted from the prescription
    extractedMedicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String },       // e.g., "500mg"
        frequency: { type: String },     // e.g., "twice a day"
        duration: { type: String },      // e.g., "7 days"
        instructions: { type: String },  // e.g., "after meals"
        // Matched medicine from our DB (if found)
        matchedMedicine: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
          default: null,
        },
      },
    ],
    // Doctor details extracted (if readable)
    doctorInfo: {
      name: { type: String },
      registrationNumber: { type: String },
      hospital: { type: String },
    },
    // Patient details extracted (if readable)
    patientInfo: {
      name: { type: String },
      age: { type: String },
      diagnosis: { type: String },
    },
    // Processing status
    status: {
      type: String,
      enum: ["processing", "completed", "failed", "partial"],
      default: "processing",
    },
    aiModel: {
      type: String,
      default: "groq",
    },
    processingTime: {
      type: Number, // milliseconds
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for user history queries
prescriptionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
