// src/controllers/invoice.controller.js
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import generatePDF from "../utils/generate-pdf.js";
import Invoice from "../models/invoice.model.js";

/**
 * Create a new invoice
 * Body: { customerName, customerPhone, items: [{name, quantity, price}], tax?, language? }
 */
const createInvoice = asyncHandler(async (req, res, next) => {
  console.log("Invoice POST received:", req.body);

  const {
    customerName,
    customerPhone,
    customerEmail,
    items = [],
    tax = 0,
    language = "en",
  } = req.body;

  if (
    !customerName ||
    !customerPhone ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new ApiError(
      400,
      "customerName, customerPhone and at least one item are required"
    );
  }

  // Calculate subtotal and total
  const subTotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.price) || 0),
    0
  );
  const totalAmount = subTotal + Number(tax || 0);

  // Create invoice object
  const invoiceDoc = {
    customerName,
    customerPhone,
    customerEmail,
    items,
    tax,
    subTotal,
    totalAmount,
    language,
    paymentStatus: "pending",
    status: "pending",
    createdBy: req.user?._id ?? null, // only populated if auth middleware exists
  };

  // Save invoice
  const invoice = await Invoice.create(invoiceDoc);

  // Generate PDF
  try {
    const pdfUrl = await generatePDF(invoice);
    invoice.pdfUrl = pdfUrl;
    await invoice.save();
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw new ApiError(500, "PDF generation failed: " + err.message);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, invoice, "Invoice created successfully"));
});

/**
 * Get all invoices (filtered by user if available)
 */
const getInvoices = asyncHandler(async (req, res) => {
  const filter = req.user?._id ? { createdBy: req.user._id } : {};
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, invoices, "Invoices fetched successfully"));
});

/**
 * Get a single invoice by ID
 */
const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id);

  if (!invoice) throw new ApiError(404, "Invoice not found");

  if (
    invoice.createdBy &&
    req.user &&
    String(invoice.createdBy) !== String(req.user._id)
  ) {
    throw new ApiError(403, "Not authorized to view this invoice");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, invoice, "Invoice fetched successfully"));
});

/**
 * Generate a PDF for an existing invoice
 */
const generateInvoicePDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id);

  if (!invoice) throw new ApiError(404, "Invoice not found");

  if (
    invoice.createdBy &&
    req.user &&
    String(invoice.createdBy) !== String(req.user._id)
  ) {
    throw new ApiError(403, "Not authorized to generate this invoice PDF");
  }

  const pdfUrl = await generatePDF(invoice);
  invoice.pdfUrl = pdfUrl;
  await invoice.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { pdfUrl }, "Invoice PDF generated successfully")
    );
});

export { createInvoice, getInvoices, getInvoiceById, generateInvoicePDF };
