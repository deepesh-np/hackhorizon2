const User = require("../models/User");
const Inventory = require("../models/Inventory");

const enrichCartWithPrices = async (cart) => {
    return Promise.all(cart.map(async (item) => {
        const inv = await Inventory.findOne({ vendor: item.vendor._id, medicine: item.medicine._id });
        return {
            ...item.toObject(),
            unitPrice: inv ? inv.price : 0
        };
    }));
};

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("cart.medicine", "name genericName brand price coverImage category")
            .populate("cart.vendor", "vendorDetails.pharmacyName vendorDetails.address vendorDetails.location");

        const cartWithPrices = await enrichCartWithPrices(user.cart);
        res.status(200).json({ success: true, cart: cartWithPrices });
    } catch (error) {
        console.error("GetCart Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   POST /api/cart
// @desc    Add or update item in cart
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { medicineId, vendorId, quantity = 1 } = req.body;
        const user = await User.findById(req.user._id);

        const existingItem = user.cart.find(
            (item) => item.medicine.toString() === medicineId && item.vendor.toString() === vendorId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({ medicine: medicineId, vendor: vendorId, quantity });
        }

        await user.save();
        
        const updatedUser = await User.findById(req.user._id)
            .populate("cart.medicine", "name genericName brand price coverImage")
            .populate("cart.vendor", "vendorDetails.pharmacyName");

        const cartWithPrices = await enrichCartWithPrices(updatedUser.cart);
        res.status(200).json({ success: true, cart: cartWithPrices });
    } catch (error) {
        console.error("AddToCart Error:", error);
        res.status(500).json({ success: false, message: "Added to cart failed" });
    }
};

// @route   PUT /api/cart/:itemId
// @desc    Update quantity of item in cart
// @access  Private
const updateQuantity = async (req, res) => {
    try {
        const { quantity } = req.body;
        const user = await User.findById(req.user._id);

        const item = user.cart.id(req.params.itemId);
        if (item) {
            item.quantity = quantity;
            if(item.quantity <= 0) {
                user.cart.pull({ _id: req.params.itemId });
            }
            await user.save();
        }

        const updatedUser = await User.findById(req.user._id)
            .populate("cart.medicine", "name genericName brand price coverImage")
            .populate("cart.vendor", "vendorDetails.pharmacyName");
            
        const cartWithPrices = await enrichCartWithPrices(updatedUser.cart);
        res.status(200).json({ success: true, cart: cartWithPrices });
    } catch (error) {
        console.error("UpdateQuantity Error", error);
        res.status(500).json({ success: false, message: "Error updating quantity" });
    }
};

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.cart.pull({ _id: req.params.itemId });
        await user.save();

        const updatedUser = await User.findById(req.user._id)
            .populate("cart.medicine", "name genericName brand price coverImage")
            .populate("cart.vendor", "vendorDetails.pharmacyName");
            
        const cartWithPrices = await enrichCartWithPrices(updatedUser.cart);
        res.status(200).json({ success: true, cart: cartWithPrices });
    } catch (error) {
        console.error("RemoveFromCart Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { getCart, addToCart, updateQuantity, removeFromCart };
