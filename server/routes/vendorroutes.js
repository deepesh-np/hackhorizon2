const express = require("express");
const { protect, authorize, requireVerifiedVendor } = require("../middleware/authmiddleware");
const {
  getMyInventory,
  addToInventory,
  updateInventory,
  removeFromInventory,
} = require("../controllers/vendorcontroller");

const router = express.Router();

// All vendor routes require authentication + vendor role + verified status
router.use(protect, authorize("vendor"), requireVerifiedVendor);

router.get("/inventory", getMyInventory);
router.post("/inventory", addToInventory);
router.put("/inventory/:id", updateInventory);
router.delete("/inventory/:id", removeFromInventory);

module.exports = router;
