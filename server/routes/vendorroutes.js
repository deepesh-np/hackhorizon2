const express = require("express");
const { protect, authorize, requireVerifiedVendor } = require("../middleware/authmiddleware");
const {
  getMyInventory,
  addToInventory,
  updateInventory,
  removeFromInventory,
  getVendorStats,
  getVendorDemand,
  getPriceInsight,
  bulkAddToInventory,
} = require("../controllers/vendorcontroller");

const router = express.Router();

// All vendor routes require authentication + vendor role + verified status
router.use(protect, authorize("vendor"), requireVerifiedVendor);

router.get("/stats", getVendorStats);
router.get("/demand", getVendorDemand);
router.get("/price-insight", getPriceInsight);
router.get("/inventory", getMyInventory);
router.post("/inventory", addToInventory);
router.post("/inventory/bulk", bulkAddToInventory);
router.put("/inventory/:id", updateInventory);
router.delete("/inventory/:id", removeFromInventory);

module.exports = router;
