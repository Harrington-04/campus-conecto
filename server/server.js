// --- server/server.js ---
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import mongoose from "mongoose";

import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import { Server } from "socket.io";
import http from "http";

dotenv.config();
connectDB();

mongoose.connection.once("open", () => {
  console.log("📦 Connected to DB:", mongoose.connection.name);
});

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://campus-conecto.vercel.app"
  ],
  credentials: true
}));

const server = http.createServer(app);

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://campus-conecto.vercel.app"
];

// 👉 socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available inside routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, try later." },
});
app.use("/api/", apiLimiter);

// Debug logs only in dev
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Server is up and running ✅" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// --- SOCKET.IO LISTENERS ---
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("register", (userId) => {
    socket.join(userId);
    console.log(`✅ User ${userId} registered to socket room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => 
  console.log(`✅ Server running on port ${PORT}`)
);

