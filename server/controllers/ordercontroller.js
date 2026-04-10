const Order = require("../models/Order");

// ─── @route   GET /api/vendor/orders ────────────────────────────────────────
// @desc    Get all orders for the logged-in vendor
// @access  Vendor only
const getVendorOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = { vendor: req.user._id };
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate("user", "name email phone")
            .populate("medicine", "name genericName brand dosageForm packSize")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            orders,
        });
    } catch (error) {
        console.error("GetVendorOrders error:", error);
        res.status(500).json({ success: false, message: "Could not fetch orders." });
    }
};

module.exports = {
    getVendorOrders,
};
