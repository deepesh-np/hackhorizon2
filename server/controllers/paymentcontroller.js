const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const Inventory = require("../models/Inventory");

const getDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const DELIVERY_RATE_PER_KM = 10;

// @route   POST /api/payment/create-order
// @desc    Create Razorpay Order
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { userLat, userLng, selectedItemIds } = req.body;
        const user = await User.findById(req.user._id).populate("cart.medicine").populate("cart.vendor");

        if (!user.cart || user.cart.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty." });
        }

        if (!selectedItemIds || !Array.isArray(selectedItemIds) || selectedItemIds.length === 0) {
            return res.status(400).json({ success: false, message: "Please select at least one item to checkout." });
        }

        let totalMedicinePrice = 0;
        let totalDeliveryFee = 0;
        let orderDetailsToSave = [];
        let vendorDeliveryFeesCalculated = {}; // Track processed vendors

        // Calculate totals for ONLY selected items
        for (const item of user.cart) {
            if (!selectedItemIds.includes(item._id.toString())) {
                continue; // Skip unselected items
            }

            const vendor = item.vendor;
            const medicine = item.medicine;
            const quantity = item.quantity;

            if (!vendor || !medicine) {
                return res.status(400).json({ success: false, message: `Invalid item in cart (missing data). Please remove and add again.` });
            }

            // Get inventory price
            const inventory = await Inventory.findOne({ vendor: vendor._id, medicine: medicine._id });
            const price = inventory ? inventory.price : (medicine.averagePrice || 0);

            totalMedicinePrice += price * quantity;

            // Calculate distance only ONCE per distinct vendor
            let deliveryFee = 0;
            if (!vendorDeliveryFeesCalculated[vendor._id.toString()]) {
                let vendorLat = 0, vendorLng = 0;
                if (vendor.vendorDetails && vendor.vendorDetails.location && vendor.vendorDetails.location.coordinates) {
                    vendorLng = vendor.vendorDetails.location.coordinates[0];
                    vendorLat = vendor.vendorDetails.location.coordinates[1];
                }

                if (userLat && userLng && vendorLat && vendorLng) {
                    const distance = getDistance(userLat, userLng, vendorLat, vendorLng);
                    deliveryFee = distance * DELIVERY_RATE_PER_KM;
                }
                
                vendorDeliveryFeesCalculated[vendor._id.toString()] = deliveryFee;
                totalDeliveryFee += deliveryFee;
            }

            orderDetailsToSave.push({
                vendor: vendor._id,
                medicine: medicine._id,
                quantity,
                // Assign the item price. Delivery fee is tracked separately if needed, 
                // but we attach it to the order to ensure vendor gets paid for it.
                // For multiple items, we bundle the delivery fee into the first item processed for that vendor.
                totalPrice: (price * quantity) + deliveryFee
            });
        }

        const grandTotal = Math.round(totalMedicinePrice + totalDeliveryFee);

        if (grandTotal < 50) {
            return res.status(400).json({ success: false, message: "Minimum order amount is ₹50" });
        }

        // Initialize Razorpay
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy_test_id',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_test_secret',
        });

        // Receipt must be <= 40 chars
        const shortId = req.user._id.toString().slice(-6);
        const options = {
            amount: grandTotal * 100, // in paise
            currency: "INR",
            receipt: `rzp_${shortId}_${Date.now()}`
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Save pending orders in DB
        const createdOrders = [];
        for (const detail of orderDetailsToSave) {
            const newOrder = await Order.create({
                user: req.user._id,
                vendor: detail.vendor,
                medicine: detail.medicine,
                quantity: detail.quantity,
                totalPrice: detail.totalPrice,
                status: "Pending",
                paymentStatus: "Pending",
                razorpayOrderId: razorpayOrder.id
            });
            createdOrders.push(newOrder._id);
        }

        res.status(200).json({
            success: true,
            razorpayOrder,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'dummy_test_id',
            pendingOrderIds: createdOrders,
            totalMedicinePrice,
            totalDeliveryFee,
            grandTotal
        });

    } catch (error) {
        console.error("CreateOrder Error:", error);
        const errorMsg = error.error?.description || error.message || "Server error during order creation";
        res.status(500).json({ success: false, message: errorMsg, details: error });
    }
};

// @route   POST /api/payment/verify
// @desc    Verify Razorpay Payment
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, selectedItemIds } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_test_secret')
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Payment success. Update orders
            await Order.updateMany(
                { razorpayOrderId: razorpay_order_id },
                { $set: { status: "Confirmed", paymentStatus: "Paid", razorpayPaymentId: razorpay_payment_id } }
            );

            // Remove only the selected/paid items from Cart
            if (selectedItemIds && selectedItemIds.length > 0) {
                await User.findByIdAndUpdate(req.user._id, { 
                    $pull: { cart: { _id: { $in: selectedItemIds } } } 
                });
            }

            res.status(200).json({ success: true, message: "Payment successful" });
        } else {
            // Payment failed / signature mismatch
            await Order.updateMany(
                { razorpayOrderId: razorpay_order_id },
                { $set: { paymentStatus: "Failed" } }
            );
            res.status(400).json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error("VerifyPayment Error:", error);
        res.status(500).json({ success: false, message: "Server error during payment verification" });
    }
};

module.exports = { createOrder, verifyPayment };
