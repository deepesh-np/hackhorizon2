const express = require("express");
const { getCart, addToCart, updateQuantity, removeFromCart } = require("../controllers/cartcontroller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateQuantity);
router.delete("/:itemId", removeFromCart);

module.exports = router;
