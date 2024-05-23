import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    paymentInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Checkout",
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true,
        default: "Pending",
        enum: ["Pending", "Cancelled", "Paid"]
    },
    orderStatus: {
        type: String,
        required: true,
        default: "Pending",
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    }
}, { timestamps: true })

const Order = mongoose.model("Order", orderSchema);
export default Order;