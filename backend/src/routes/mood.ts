import express from "express";
import { auth } from "../middleware/auth";
import { createMood } from "../controllers/moodController";

const router = express.Router();

router.use(auth);
router.post("/", createMood);

export default router;