const Order = require("../models/Order");

// ─── @route   GET /api/orders/vendor ────────────────────────────────────────
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

// ─── @route   PATCH /api/orders/vendor/:id/status ───────────────────────────
// @desc    Update order status (Confirmed, Delivered, Cancelled)
// @access  Vendor only
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Confirmed", "Delivered", "Cancelled"];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            vendor: req.user._id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found or you don't own it.",
            });
        }

        // Validate status transitions
        if (order.status === "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Cannot change status of a delivered order.",
            });
        }
        if (order.status === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot change status of a cancelled order.",
            });
        }

        order.status = status;
        await order.save();

        const populated = await order.populate([
            { path: "user", select: "name email phone" },
            { path: "medicine", select: "name genericName brand dosageForm packSize" },
        ]);

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}.`,
            order: populated,
        });
    } catch (error) {
        console.error("UpdateOrderStatus error:", error);
        res.status(500).json({ success: false, message: "Could not update order status." });
    }
};

module.exports = {
    getVendorOrders,
    updateOrderStatus,
};
