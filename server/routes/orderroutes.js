const express = require("express");
const { protect, authorize, requireVerifiedVendor } = require("../middleware/authmiddleware");
const { getVendorOrders } = require("../controllers/ordercontroller");

const router = express.Router();

// Vendor Order Routes
router.get("/vendor", protect, authorize("vendor"), requireVerifiedVendor, getVendorOrders);

module.exports = router;
