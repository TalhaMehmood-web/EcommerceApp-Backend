import mongoose from "mongoose";
import User from "../models/userModel.js"
import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";
import asyncHandler from "express-async-handler"
export const createCart = async (req, res) => {

    try {
        const userId = req.user?._id;
        const { productId } = req.params;
        const { quantity } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!!" });
        }

        const cartProduct = await Product.findById(productId)
        if (!cartProduct) {
            return res.status(400).json({ message: "Product not found!!" })
        }
        if (quantity > cartProduct.stockQuantity) {
            return res.status(400).json({ message: "Requested Quantity is invalid " })
        }
        cartProduct.stockQuantity -= quantity;
        await cartProduct.save();
        const totalPrice = cartProduct.regularPrice * quantity;

        const cart = await Cart.create({
            user: userId,
            product: productId,
            quantity,
            totalPrice,
            admin: cartProduct?.createdBy
        })
        await cart.save()
        await cart.populate("product")
        res.status(201).json(cart)


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }

}
export const getCarts = async (req, res) => {
    try {
        const userId = req.user?._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const carts = await Cart.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $addFields: {
                    "product": { $arrayElemAt: ["$product", 0] }
                }
            },
            {
                $addFields: {
                    "productTitle": "$product.title",
                    "picture": "$product.picture",
                    "regularPrice": "$product.regularPrice",
                    "productId": "$product._id",
                    "createdBy": "$product.createdBy"
                }
            },
            {
                $project: {
                    "product": 0
                }
            }
        ]);

        const totalCarts = carts.length;

        res.status(200).json({ carts, totalCarts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteCart = asyncHandler(async (req, res) => {
    try {
        const { cartId } = req.params;
        const cart = await Cart.findById(cartId)
        if (!cart) {
            return res.status(404).json({ message: "Cart not found!" })
        }
        const productId = cart?.product;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "product not found!" })
        }
        product.stockQuantity += cart?.quantity
        await product.save();
        await Cart.findByIdAndDelete(cartId)
        res.status(203).json({ message: "cart deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error?.message })
    }
})

export const editCart = asyncHandler(async (req, res) => {
    try {
        const { cartId } = req.params;
        const { quantity } = req.body.fieldsToUpdate;

        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ message: "Cart Not Found!" });
        }

        const productId = cart.product;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product Not Found!" });
        }

        // Update cart quantity and price
        cart.quantity = quantity;
        cart.totalPrice = quantity * product.regularPrice;

        // Update product stock quantity
        const quantityDifference = quantity - cart.quantity;
        product.stockQuantity -= quantityDifference;
        await product.save()
        await cart.save()

        res.status(203).json({ message: "Cart Updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
