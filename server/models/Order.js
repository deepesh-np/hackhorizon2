const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medicine",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Delivered", "Cancelled"],
            default: "Pending",
        },
        deliveryAddress: {
            street: String,
            city: String,
            state: String,
            pincode: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
