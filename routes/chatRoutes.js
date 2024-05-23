import express from "express";
import verifyJWT from "../middleware/authMiddleware.js";
import { accessChat, addMessageToChat, allMessages, updateReadStatus } from "../controllers/chatControllers.js";

const router = express.Router();

router.get("/chats", verifyJWT, accessChat)
router.post("/add-message/:chatId", verifyJWT, addMessageToChat)
router.get("/messages/:chatId", allMessages)
router.put("/update-chat/:chatId" , verifyJWT,updateReadStatus)
export default router;