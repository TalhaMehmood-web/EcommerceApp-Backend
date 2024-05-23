import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import mongoose from "mongoose";
export const getOrdersOfCustomer = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const orders = await Order.aggregate([
            {
                $match: {
                    customer: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "checkouts",
                    localField: "paymentInfo",
                    foreignField: "_id",

                    as: "paymentInfo"

                }
            },
            { $unwind: "$paymentInfo" },
            {
                $project: {
                    "_id": 1,
                    "orderNumber": 1,
                    paymentStatus: 1,
                    orderStatus: 1,
                    "invoiceId": "$paymentInfo._id",
                    "invoiceNo": "$paymentInfo.invoiceNo",
                    "deliveryType": "$paymentInfo.deliveryType",
                    "shippingCost": "$paymentInfo.shippingCost",
                    "total": 1,
                    createdAt: 1
                }
            }
        ])
        res.status(200).json(orders)
    } catch (error) {
        console.log(error);
    }
})
export const AllOrders = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: "checkouts",
                    foreignField: "_id",
                    localField: "paymentInfo",
                    as: "paymentInfo"
                }
            },
            {
                $unwind: "$paymentInfo"
            },
            {
                $unwind: "$paymentInfo.carts"
            },
            {
                $match: {
                    "paymentInfo.carts.createdBy": userId
                }
            },
            {
                $lookup: {
                    from: "products",
                    foreignField: "_id",
                    localField: "paymentInfo.carts.product",
                    as: "paymentInfo.carts.product"
                }
            },
            {
                $unwind: "$paymentInfo.carts.product"
            },
            {
                $addFields: {
                    "total": {
                        $multiply: ["$paymentInfo.carts.quantity", "$paymentInfo.carts.product.regularPrice"]
                    },

                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "customer",
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $group: {
                    _id: "$_id",
                    orderNumber: { $first: "$orderNumber" },
                    paymentStatus: { $first: "$paymentStatus" },
                    orderStatus: { $first: "$orderStatus" },
                    total: { $sum: "$total" },
                    customerName: { $first: "$customer.fullname" },
                    picture: { $first: "$customer.picture" },
                    deliveryType: { $first: "$paymentInfo.deliveryType" },
                    date: { $first: "$createdAt" }
                }
            },
            {
                $sort: {
                    date: -1
                }
            }


        ]);

        if (orders.length === 0) {
            return res.status(400).json({ message: "No Orders found!!" })
        }
        res.status(200).json(orders)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
// all customers of an admin
export const allCustomers = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: "checkouts",
                    foreignField: "_id",
                    localField: "paymentInfo",
                    as: "paymentInfo"
                }
            },
            {
                $unwind: "$paymentInfo"
            },
            {
                $unwind: "$paymentInfo.carts"
            },
            {
                $match: {
                    "paymentInfo.carts.createdBy": userId
                }
            }, {
                $lookup: {
                    from: "products",
                    foreignField: "_id",
                    localField: "paymentInfo.carts.product",
                    as: "paymentInfo.carts.product"
                }
            },
            {
                $unwind: "$paymentInfo.carts.product"
            },
            {
                $addFields: {
                    "totalSpent": {
                        $multiply: ["$paymentInfo.carts.quantity", "$paymentInfo.carts.product.regularPrice"]
                    },

                }
            },
            {
                $lookup: {
                    from: "shippinginfos",
                    foreignField: "_id",
                    localField: "paymentInfo.shippingInfo",
                    as: "paymentInfo.shippingInfo"
                }
            },
            {
                $unwind: "$paymentInfo.shippingInfo"
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "customer",
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $group: {
                    _id: "$customer._id",
                    name: { $first: "$customer.fullname" },
                    email: { $first: "$customer.email" },
                    picture: { $first: "$customer.picture" },
                    country: { $first: "$paymentInfo.shippingInfo.location.country" },
                    city: { $first: "$paymentInfo.shippingInfo.location.city" },
                    orderIds: { $addToSet: "$_id" },
                    totalSpent: { $sum: "$totalSpent" },
                    lastOrderDate: { $last: "$createdAt" }

                }
            },
            {
                $addFields: {
                    orders: { $size: "$orderIds" }
                }
            },
            {
                $project: {
                    orderIds: 0
                }
            }
        ]);
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error?.message });
    }
});
// track order
export const trackOrder = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(orderId),
                }
            }, {
                $lookup: {
                    from: "checkouts",
                    foreignField: "_id",
                    localField: "paymentInfo",
                    as: "orderDetail",
                }
            },
            {
                $unwind: "$orderDetail",
            },
            {
                $lookup: {
                    from: "products",
                    foreignField: "_id",
                    localField: "orderDetail.carts.product",
                    as: "populatedCarts"
                }
            },
            {
                $addFields: {
                    "carts": {
                        $map: {
                            input: "$orderDetail.carts",
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
                                "_id": "$$cart.product._id",
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
            }, {
                $addFields: {
                    totalProducts: { $size: "$carts" }, // Count the total number of products
                    totalQuantity: { $sum: "$carts.quantity" } // Sum of quantity for each cart
                }
            },
            {
                $project: {
                    _id: 1,
                    orderNumber: 1,
                    totalProducts: 1,
                    totalQuantity: 1,
                    totalPrice: "$total",
                    createdAt: 1,
                    carts: 1,
                    orderStatus: 1,
                }
            }
        ])
        res.status(200).json(order[0])
    } catch (error) {
        res.status(500).json({ message: error?.message })
    }
})
export const getSingleAdminOrder = asyncHandler(async (orderId, adminId) => {
    const order = await Order.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(orderId)
            }
        },
        {
            $lookup: {
                from: "checkouts",
                foreignField: "_id",
                localField: "paymentInfo",
                as: "paymentInfo"
            }
        },
        {
            $unwind: "$paymentInfo"
        },
        {
            $unwind: "$paymentInfo.carts"
        },
        {
            $match: {
                "paymentInfo.carts.createdBy": new mongoose.Types.ObjectId(adminId)
            }
        }, {
            $lookup: {
                from: "products",
                foreignField: "_id",
                localField: "paymentInfo.carts.product",
                as: "product"
            }
        }, {
            $unwind: "$product"
        },
        {
            $addFields: {
                "total": {
                    $multiply: ["$paymentInfo.carts.quantity", "$product.regularPrice"]
                },

            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "customer",
                as: "customer"
            }
        },
        {
            $unwind: "$customer"
        },
        {
            $group: {
                _id: "$_id",
                orderNumber: { $first: "$orderNumber" },
                paymentStatus: { $first: "$paymentStatus" },
                orderStatus: { $first: "$orderStatus" },
                total: { $sum: "$total" },
                customerName: { $first: "$customer.fullname" },
                picture: { $first: "$customer.picture" },
                deliveryType: { $first: "$paymentInfo.deliveryType" },
                date: { $first: "$createdAt" }
            }
        },
    ]);
    if (order) {
        return order[0];
    } else {
        console.log("nothing found");
    }
});



