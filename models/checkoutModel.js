import mongoose from "mongoose";
const checkoutSchema = new mongoose.Schema({
    invoiceNo: {
        type: String,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    shippingInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShippingInfo",
        required: true
    },
    deliveryType: {
        type: String,
        required: true,
        enum: ["Free Shipping", "Standard Shipping", "One Day Shipping", "Two Days Shipping"]
    },
    shippingCost: {
        type: Number,
        required: true
    },
    cardType: {
        type: String,
        required: true
    },
    cardNumber: {
        type: String,
        required: true,
    },
    cardHolderName: {
        type: String,
        required: true
    },
    expiryMonth: {
        type: String,
        required: true
    },
    expiryYear: {
        type: String,
        required: true
    },
    CVC: {
        type: String,
        required: true,
    },
    carts: {
        type: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                createdBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                }
            }],
        required: true
    },
    shippingCost: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    }

}, { timestamps: true })

const Checkout = mongoose.model("Checkout", checkoutSchema);
export default Checkout;