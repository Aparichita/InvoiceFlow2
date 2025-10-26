// src/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import authRoutes from "./routes/auth.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { stripeWebhooks } from "./controllers/webhooks.js";

const app = express();

// --------------------
// Stripe webhooks (before parsers)
// --------------------
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

app.post(
  "/api/payments/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.isStripeWebhook = true;
    next();
  }
);

// --------------------
// Parsers
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Static files
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/public", express.static(path.join(__dirname, "../public")));

// --------------------
// Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes); // WhatsApp/email
app.use("/api/invoices", invoiceRoutes); // Invoice creation & history
app.use("/api/payments", paymentRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// --------------------
// Health check
// --------------------
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

// --------------------
// Catch-all 404
// --------------------
// Works with all routers and avoids PathError
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// --------------------
// Global Error Handler
// --------------------
app.use(errorMiddleware);

export default app;
