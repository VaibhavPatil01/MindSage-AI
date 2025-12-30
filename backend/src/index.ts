import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { serve } from "inngest/express";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import moodRouter from "./routes/mood.js";
import activityRouter from "./routes/activity.js";
import { connectDB } from "./utils/db.js";
import { inngest } from "./inngest/client.js";
import { functions as inngestFunctions } from "./inngest/functions.js";
import { logger } from "./utils/logger.js";

const app = express();

// ========== MIDDLEWARE ==========
// 1. Security
app.use(helmet());

// 2. CORS
app.use(
  cors({
    origin: ["http://localhost:3001", "https://mind-sage-ai.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request logging
app.use(morgan("dev"));

// ========== TEST ROUTES ==========
app.get("/api/debug/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "***SET***" : "NOT SET",
    },
  });
});

app.post("/api/debug/echo", (req, res) => {
  console.log("Echo endpoint called with body:", req.body);
  res.json({
    message: "Echo response",
    yourData: req.body,
    timestamp: new Date().toISOString(),
  });
});

// ========== INNGEST ==========
app.use(
  "/api/inngest",
  serve({ client: inngest, functions: inngestFunctions })
);

// ========== HEALTH CHECK ==========
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    service: "MindSage AI Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to MindSage AI Backend API",
    endpoints: {
      health: "/health",
      debug: "/api/debug/test",
      echo: "/api/debug/echo (POST)",
      chat: "/chat/*",
      auth: "/auth/*",
      mood: "/api/mood/*",
      activity: "/api/activity/*",
      inngest: "/api/inngest",
    },
    documentation: "See README for API documentation",
  });
});

// ========== MAIN ROUTES ==========
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/api/mood", moodRouter);
app.use("/api/activity", activityRouter);

// ========== ERROR HANDLING ==========
app.use((req, res, next) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Route not found",
    path: req.url,
    method: req.method,
    availableEndpoints: [
      "/health",
      "/api/debug/test",
      "/api/debug/echo",
      "/chat/sessions",
      "/chat/sessions/:id/messages",
    ],
  });
});

// Error handling middleware
app.use(errorHandler);

// ========== START SERVER ==========
const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`
========================================
MindSage AI Backend Server Started!
========================================
✅ Port: ${PORT}
✅ Environment: ${process.env.NODE_ENV || "development"}
✅ Health Check: http://localhost:${PORT}/health
✅ Debug Test: http://localhost:${PORT}/api/debug/test
✅ Chat Endpoint: http://localhost:${PORT}/chat/sessions
✅ Frontend: http://localhost:3000 ========================================
      `);

      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
