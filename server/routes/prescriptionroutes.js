const express = require("express");

const dotenv = require("dotenv");
dotenv.config();

const { protect } = require("../middleware/authmiddleware");
const {
  scanPrescription,
  analyzeText,
  getPrescriptionHistory,
  getPrescriptionById,
} = require("../controllers/prescriptioncontroller");

const router = express.Router();

// All prescription routes require authentication
router.use(protect);

// Scan/analyze
router.post("/scan", scanPrescription);
router.post("/analyze-text", analyzeText);

// History
router.get("/history", getPrescriptionHistory);
router.get("/:id", getPrescriptionById);

module.exports = router;
