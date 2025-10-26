import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js"; // <--- use your app.js
const PORT = process.env.PORT || 3500;

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
