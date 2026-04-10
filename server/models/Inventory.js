const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    mrp: {
      type: Number, // Maximum Retail Price
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
    },
    batchNumber: { type: String },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Unique constraint: one vendor can't have duplicate medicine entry
inventorySchema.index({ vendor: 1, medicine: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);