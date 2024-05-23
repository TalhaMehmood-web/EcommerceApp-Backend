import asyncHandler from "express-async-handler"
import Checkout from "../models/checkoutModel.js";
import mongoose from "mongoose";
import Order from "../models/orderModel.js"
export const getInvoice = asyncHandler(async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const userId = req.params;
        const order = await Order.findOne({ paymentInfo: invoiceId });

        const checkout = await Checkout.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(invoiceId)
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "carts.product",
                    foreignField: "_id",
                    as: "populatedCarts"
                }
            },
            {
                $addFields: {
                    "carts": {
                        $map: {
                            input: "$carts",
                            as: "cart",
                            in: {
                                $mergeObjects: [
                                    "$$cart",
                                    {
                                        "product": {
                                            $arrayElemAt: [
                                                "$populatedCarts",
                                                { $indexOfArray: ["$populatedCarts._id", "$$cart.product"] }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $unset: "populatedCarts" // Remove the populatedCarts field
            },
            {
                $addFields: {
                    "carts": {
                        $map: {
                            input: "$carts",
                            as: "cart",
                            in: {
                                "Sr No": { $add: [{ $indexOfArray: ["$carts", "$$cart"] }, 1] },
                                "productTitle": "$$cart.product.title",
                                "productPicture": "$$cart.product.picture",
                                "vendor": "$$cart.product.vendor",
                                "quantity": "$$cart.quantity",
                                "regularPrice": "$$cart.product.regularPrice",
                                "itemsTotal": { $multiply: ["$$cart.quantity", "$$cart.product.regularPrice"] }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "shippinginfos",
                    localField: "shippingInfo",
                    foreignField: "_id",
                    as: "shippingInfo"
                }
            },
            {
                $unwind: "$shippingInfo"
            },
            {
                $addFields: {
                    "subTotal": { $sum: "$carts.itemsTotal" },
                    "grandTotal": { $add: ["$shippingCost", { $sum: "$carts.itemsTotal" }] }
                }
            },


            {
                $project: {
                    _id: 1,
                    invoiceNo: 1,
                    "shippingAddress": {
                        "customerName": "$shippingInfo.fullName",
                        "address": "$shippingInfo.address.addressLineOne",
                        "email": "$shippingInfo.email",
                        "phoneNumber": "$shippingInfo.phoneNumber"
                    },
                    "billingAddress": {
                        "customerName": "$shippingInfo.fullName",
                        "address": "$shippingInfo.address.addressLineOne",
                        "email": "$shippingInfo.email",
                        "phoneNumber": "$shippingInfo.phoneNumber"
                    },
                    carts: 1,
                    totalPrice: 1,
                    grandTotal: 1,
                    createdAt: 1,
                    shippingCost: 1
                }
            },

        ]);

        res.status(200).json({ checkout: checkout[0], orderNumber: order?.orderNumber })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})