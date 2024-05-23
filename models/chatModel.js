import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    messages: {
        type: [
            {
                sender: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                text: {
                    type: String,
                    required: true
                },
                read: {
                    type: Boolean,
                    default: false
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        default: []
    }
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
