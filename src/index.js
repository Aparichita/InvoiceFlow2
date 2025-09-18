import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Debug middleware - log all incoming requests
app.use((req, res, next) => {
  console.log("📨 Incoming Request:", {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Register routes
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes mounted at /api/auth");

app.use("/api/notifications", notificationRoutes);
console.log("✅ Notification routes mounted at /api/notifications");

// Health check
app.get("/", (req, res) => {
  console.log("🏥 Health check endpoint hit");
  res.send("InvoiceFlow API running...");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🎯 Server running on http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use!`);
      } else {
        console.error("❌ Server error:", error.message);
      }
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection failed:", err.message);
    console.log("⚠️  Starting server without DB...");

    app.listen(PORT, () => {
      console.log(`🎯 Server running on http://localhost:${PORT} (without DB)`);
    });
  });

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
