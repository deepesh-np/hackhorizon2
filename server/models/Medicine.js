const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
    },
    genericName: {
      type: String,
      required: [true, "Generic name is required"],
      trim: true,
      index: true,
    },
    activeIngredients: [
      {
        name: { type: String, required: true },
        strength: { type: String }, // e.g., "500mg"
      },
    ],
    therapeuticCategory: {
      type: String,
      required: true,
      enum: [
        "Antibiotic",
        "Antifungal",
        "Antiviral",
        "Analgesic",
        "Antipyretic",
        "Antihypertensive",
        "Antidiabetic",
        "Antidepressant",
        "Antihistamine",
        "Antacid",
        "Cardiovascular",
        "Respiratory",
        "Gastrointestinal",
        "Neurological",
        "Hormonal",
        "Vitamin/Supplement",
        "Other",
      ],
    },
    dosageForm: {
      type: String,
      enum: [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Cream",
        "Drops",
        "Inhaler",
        "Patch",
        "Gel",
        "Ointment",
        "Powder",
        "Suspension",
        "Other",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    sideEffects: [{ type: String }],
    contraindications: [{ type: String }],
    warnings: [{ type: String }],
    packSize: {
      type: String, // e.g., "10 tablets", "100ml"
    },
    storageInstructions: {
      type: String,
      default: "Store in a cool, dry place away from direct sunlight.",
    },
    manufacturer: { type: String },
    brand: { type: String },
    isBranded: { type: Boolean, default: true },
    averagePrice: {
      type: Number,
      default: 0,
    },
    regulatoryApproval: {
      approvedBy: { type: String, default: "CDSCO" },
      approvalNumber: { type: String },
      isApproved: { type: Boolean, default: false },
    },
    prescriptionRequired: { type: Boolean, default: false },
    equivalentMedicines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
      },
    ],
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for full-text search
medicineSchema.index({
  name: "text",
  genericName: "text",
  "activeIngredients.name": "text",
  brand: "text",
  manufacturer: "text",
});

module.exports = mongoose.model("Medicine", medicineSchema);