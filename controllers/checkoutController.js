import asyncHandler from "express-async-handler"
import ShippingInfo from "../models/ShippingModel.js";
import Cart from "../models/cartModel.js";
import Checkout from "../models/checkoutModel.js";
import { InvoiceId, orderId } from "../utils/IDGenerators.js";
import Order from "../models/orderModel.js";
import Chat from "../models/chatModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { getSingleAdminOrder } from "./orderControllers.js";

export const checkoutPayment = asyncHandler(async (req, res) => {
    try {
        const { cardType, cardNumber, cardHolderName, expiryMonth, expiryYear, CVC, shippingCost, deliveryType, carts } = req.body;
        const userId = req.user?._id
        const shippingInfo = await ShippingInfo.findOne({ user: userId })
        if (!shippingInfo) {
            return res.status(400).json({ message: "Kindly add you shipping address" })
        }
        const cartPromises = carts.map(async (item) => {
            const cart = await Cart.findByIdAndDelete(item?.cartId);
            return cart;
        });

        let products = [];
        let admins = [];
        const cartItems = await Promise.all(cartPromises);
        let totalPrice = 0;
        cartItems.forEach(cart => {
            if (cart) {
                totalPrice += cart.totalPrice;
                admins.push(cart.admin.toString());
                products.push({
                    product: cart.product,
                    quantity: cart.quantity,
                    createdBy: cart.admin
                });
            }
        });
        const checkout = await Checkout.create({
            customer: userId,
            shippingInfo: shippingInfo?._id,
            deliveryType,
            cardType,
            cardNumber,
            cardHolderName,
            expiryMonth,
            expiryYear,
            CVC,
            shippingCost,
            carts: products,
            totalPrice,
            invoiceNo: InvoiceId()
        })
        await checkout.save();
        if (!checkout) {
            return res.status(500).json({ message: "Something went wrong" })
        }
        const singleOrder = {
            orderNumber: orderId(),
            customer: userId,
            paymentInfo: checkout?._id,
            total: totalPrice,

        }
        const order = await Order.create(singleOrder)
        await order.save();
        const uniqueAdmins = [...new Set(admins)]; // Get unique values from admins array
        uniqueAdmins.forEach(async (admin) => {
            const adminSocketId = getReceiverSocketId(admin);
            const socketOrder = await getSingleAdminOrder(order?._id, admin)

            io.to(adminSocketId).emit("order", socketOrder); // Emit orders directly
        });
        // Creating chats

        const chatPromises = uniqueAdmins.map(async (adminId) => {

            // Check if chat already exists between user and admin
            const existingChat = await Chat.findOne({ users: { $all: [userId, adminId] } });

            // If chat doesn't exist, create a new one
            if (!existingChat) {
                const chat = await Chat.create({
                    users: [userId, adminId],
                });

                // Save the chat
                await chat.save();
            }
        });

        await Promise.all(chatPromises);


        res.status(201).json(checkout)
    } catch (error) {
        res.status(500).json({ message: error?.message })
    }
})