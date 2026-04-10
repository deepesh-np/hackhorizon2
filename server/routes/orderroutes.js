const express = require("express");
const { protect, authorize, requireVerifiedVendor } = require("../middleware/authmiddleware");
const { getVendorOrders, updateOrderStatus } = require("../controllers/ordercontroller");

const router = express.Router();

// Vendor Order Routes
router.get("/vendor", protect, authorize("vendor"), requireVerifiedVendor, getVendorOrders);
router.patch("/vendor/:id/status", protect, authorize("vendor"), requireVerifiedVendor, updateOrderStatus);

module.exports = router;
