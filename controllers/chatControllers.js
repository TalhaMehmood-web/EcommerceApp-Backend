import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../socket/socket.js";
import User from "../models/userModel.js"
export const accessChat = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const chats = await Chat.aggregate([
            {
                $match: {
                    users: { $elemMatch: { $eq: userId } }
                }
            },
            {
                $unwind: "$users"
            }, {
                $match: {
                    users: { $ne: userId }
                }
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "users",
                    as: "admin"
                }
            },
            {
                $unwind: "$admin"
            },
            {
                $addFields: {
                    lastMessage: {
                        $cond: {
                            if: { $gt: [{ $size: "$messages" }, 0] },
                            then: { $arrayElemAt: ["$messages", -1] },
                            else: null
                        }
                    }
                }
            },
            {
                $project: {
                    _id: "$admin._id",
                    name: "$admin.fullname",
                    email: "$admin.email",
                    picture: "$admin.picture",
                    chatId: "$_id",
                    lastMessage: 1,

                }
            }
        ])
        res.status(200).json(chats)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export const addMessageToChat = asyncHandler(async (req, res) => {
    const senderId = req.user?._id;

    const { chatId } = req.params;
    const { message } = req.body;

    // Validate if the chat exists
    const sender = await User.findById(senderId);
    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat not found." });
    }
    if (!chat?.users.includes(senderId)) {
        return res.status(403).json({ message: 'User is not authorized.' })
    }

    // Find the receiver's ID
    const receiverId = chat.users.find(user => user.toString() !== senderId.toString());
    const receiverSocketId = getReceiverSocketId(receiverId)
    const senderSocketId = getReceiverSocketId(senderId)
    chat.messages.push({ sender: senderId, text: message });
    if (receiverSocketId) {
        [senderSocketId, receiverSocketId].forEach(user => {

            io.to(user).emit("newMessage", {
                _id: new mongoose.Types.ObjectId(),
                sender: {
                    _id: senderId,
                    fullname: sender?.fullname,
                    picture: sender?.picture
                },
                text: message,
                read: false,
                createdAt: Date.now(),
                receiverId,
                chatId
            })
        })

    }
    await chat.save();
    const chats = await Chat.aggregate([
        {
            $match: {
                users: new mongoose.Types.ObjectId(receiverId)
            }
        },
        {
            $unwind: "$messages"
        },
        {
            $match: {
                "messages.sender": { $ne: new mongoose.Types.ObjectId(receiverId) },
                "messages.read": false
            }
        },
        {
            $group: {
                _id: "$_id",
                chatId: { $first: "$_id" },
                unreadMessages: { $push: "$messages" }
            }
        },
        {
            $project: {
                _id: 0,
                chatId: 1,
                unreadMessages: 1
            }
        }
    ]);
    const totalUnreadMessages = chats.reduce((total, chat) => total + chat.unreadMessages.length, 0);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("notifications", { unreadMessages: chats, totalUnreadMessages })
    }
    res.status(200).json(chat.messages[chat.messages.length - 1]);
});
export const allMessages = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(chatId)
                }
            },
            {
                $unwind: "$messages" // Unwind messages array
            },
            {
                $lookup: {
                    from: "users", // Assuming the collection name is 'users'
                    let: { senderId: "$messages.sender" }, // Variable for sender ID
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$senderId"] } // Match sender ID
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                fullname: 1,
                                picture: 1

                            }
                        }
                    ],
                    as: "messages.sender"
                }
            },
            {
                $unwind: "$messages.sender"
            },
            {
                $group: {
                    _id: "$_id",
                    messages: { $push: "$messages" }
                }
            }
        ]);

        res.status(200).json(chat[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export const updateReadStatus = asyncHandler(async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ message: "Chat not found." });
        }

        // Update the read status of all messages in the messages array
        await Chat.updateOne(
            { _id: chatId },
            { $set: { "messages.$[].read": true } }
        );

        res.status(200).json({ message: "Read status updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
});

