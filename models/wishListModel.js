import mongoose from "mongoose";
const wishlistSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema)
export default Wishlist;