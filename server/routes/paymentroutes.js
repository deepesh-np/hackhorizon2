const express = require("express");
const { createOrder, verifyPayment } = require("../controllers/paymentcontroller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

module.exports = router;
