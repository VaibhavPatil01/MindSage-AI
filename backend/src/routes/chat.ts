// backend/src/routes/chat.ts
import express from "express";
import {
  createChatSession,
  getChatSession,
  sendMessage,
  getChatHistory,
  getAllChatSessions, // Add this import
} from "../controllers/chat";
import { auth } from "../middleware/auth";

const router = express.Router();

router.use(auth);
router.post("/sessions", createChatSession);
router.get("/sessions", getAllChatSessions); // Add this line - LIST all sessions
router.get("/sessions/:sessionId", getChatSession);
router.post("/sessions/:sessionId/messages", sendMessage);
router.get("/sessions/:sessionId/history", getChatHistory);

export default router;