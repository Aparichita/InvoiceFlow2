// src/routes/invoice.routes.js
import express from "express";
import path from "path";
import Invoice from "../models/invoice.model.js"; // <-- ADD THIS

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  generateInvoicePDF,
} from "../controllers/invoice.controller.js";

const router = express.Router();

// CRUD routes
router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);

// PDF generation
router.post("/:id/pdf", generateInvoicePDF);

// Download PDF route
router.get("/:id/download", async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (!invoice.pdfUrl) {
      return res.status(404).json({ message: "PDF not generated yet" });
    }

    // Extract file name from pdfUrl
    const fileName = invoice.pdfUrl.split("/").pop(); // e.g., INV-1694947200000.pdf
    const filePath = path.join(process.cwd(), "public", "invoices", fileName);

    res.download(filePath);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error downloading file", error: err.message });
  }
});

export default router;
