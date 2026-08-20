import { getMessages, sendMessage } from "../controllers/messageController.js";
import express from "express";
import protect from "../middleware/protect.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/:groupId", protect, getMessages);

export default router;
