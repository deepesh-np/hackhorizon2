const express = require("express");
const { protect, authorize } = require("../middleware/authmiddleware");
const {
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
  chatMedicine,
} = require("../controllers/medicinecontroller");

const router = express.Router();

// ─── Public Routes ───────────────────────────────────────────────────────────
// Anyone can search and view medicines
router.get("/search", searchMedicines);
router.get("/info", getDrugInfo);
router.get("/:id", getMedicineById);
router.get("/:id/alternatives", getAlternatives);
router.get("/:id/prices", getPriceComparison);
router.get("/:id/pharmacies", getNearbyPharmacies);
router.get("/:id/compare/:altId", compareMedicines);
router.post("/chat", chatMedicine);

// ─── Admin Routes ────────────────────────────────────────────────────────────
// Only admins can add/edit/delete medicines from the catalog
router.post("/", protect, authorize("admin"), addMedicine);
router.put("/:id", protect, authorize("admin"), updateMedicine);
router.delete("/:id", protect, authorize("admin"), deleteMedicine);

module.exports = router;
