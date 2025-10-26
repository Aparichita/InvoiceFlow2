// src/routes/invoice.routes.js
import express from "express";
import path from "path";
import Invoice from "../models/invoice.model.js";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  generateInvoicePDF,
} from "../controllers/invoice.controller.js";
console.log("Invoice routes loaded");

const router = express.Router();

// CREATE invoice
router.post("/", createInvoice);

// GET all invoices
router.get("/", getInvoices);

// GET invoice by ID
router.get("/:id", getInvoiceById);

// GENERATE invoice PDF
router.post("/:id/pdf", generateInvoicePDF);

// DOWNLOAD invoice PDF
router.get("/:id/download", async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (!invoice.pdfUrl) {
      return res.status(404).json({ message: "PDF not generated yet" });
    }

    // Extract filename from URL (e.g., INV-1694947200000.pdf)
    const fileName = invoice.pdfUrl.split("/").pop();
    const filePath = path.join(process.cwd(), "public", "invoices", fileName);

    res.download(filePath);
  } catch (err) {
    console.error("Error downloading PDF:", err);
    res
      .status(500)
      .json({ message: "Error downloading file", error: err.message });
  }
});

export default router;
