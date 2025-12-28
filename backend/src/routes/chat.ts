import express from "express";
import {
  createChatSession,
  getChatSession,
  sendMessage,
  getChatHistory,
} from "../controllers/chat";
import { auth } from "../middleware/auth";

const router = express.Router();

router.use(auth);
router.post("/sessions", createChatSession);
router.get("/sessions/:sessionId", getChatSession);
router.post("/sessions/:sessionId/messages", sendMessage);
router.get("/sessions/:sessionId/history", getChatHistory);

export default router;

// let response = pm.response.json()
// pm.globals.set("access_token", response.access_token)