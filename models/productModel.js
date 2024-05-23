import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    picture: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    categoryTitle: {
        type: String,
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salesPrice: {
        type: Number,
        required: true
    },
    shippingType: {
        type: Boolean,
        default: false,
    },
    deliveryType: {
        type: String,

    },
    vendor: {
        type: String,
        required: true
    },
    stockQuantity: {
        type: Number,
        required: true
    },
    offer: {
        type: Number,
        default: 0
    },
    collections: {
        type: String,

    },
    tags: {
        type: [String]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    reviews: {
        type: [
            {
                rating: {
                    type: Number,
                    default: 0,
                    max: 5,
                    required: true
                },
                comment: {
                    type: String,
                    required: true,
                },
                reviewedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    }

}, { timestamps: true })

const Product = mongoose.model("Product", productSchema);
export default Product;