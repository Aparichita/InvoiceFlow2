// src/models/invoice.model.js
import mongoose from "mongoose";

// Item sub-schema
const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Item quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price must be >= 0"],
    },
  },
  { _id: false }
);

// Invoice schema
const invoiceSchema = new mongoose.Schema(
  {
    // ✅ Added field (was missing)
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    customerPhone: {
      type: String,
      required: [
        true,
        "Customer phone number is required for WhatsApp delivery",
      ],
      trim: true,
    },

    items: {
      type: [itemSchema],
      validate: [
        (arr) => arr.length > 0,
        "Invoice must contain at least one item",
      ],
    },

    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    pdfUrl: {
      type: String, // location of generated PDF (local / cloud)
    },

    // ✅ Renamed “status” logic to a clear “paymentStatus”
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    whatsappStatus: {
      type: String,
      enum: ["not_sent", "sent", "delivered", "failed"],
      default: "not_sent",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // set to true if you use auth
    },

    // ✅ Optional fields for integrations
    paymentProvider: {
      type: String,
      enum: ["razorpay", "stripe", null],
      default: null,
    },

    paymentProviderId: {
      type: String, // e.g., Razorpay order_id or Stripe charge id
    },

    // ✅ Added optional language field (used in controller)
    language: {
      type: String,
      default: "en",
    },

    // ✅ Added optional overall invoice status (used in controller)
    status: {
      type: String,
      default: "pending",
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Auto-generate invoice number before validation
invoiceSchema.pre("validate", function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = "INV-" + Date.now();
  }
  next();
});

export default mongoose.model("Invoice", invoiceSchema);
