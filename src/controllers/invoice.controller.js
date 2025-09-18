import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import generatePDF from "../utils/generate-pdf.js";
import Invoice from "../models/invoice.model.js";

/**
 * createInvoice
 * Body: { customerName, customerPhone, customerEmail?, items: [{name, quantity, price}], tax?, language? }
 */
const createInvoice = asyncHandler(async (req, res) => {
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
      "customerName, customerPhone AND at least one item are required"
    );
  }

  // calculate subtotal and total
  const subTotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.price) || 0),
    0
  );
  const totalAmount = subTotal + Number(tax || 0);

  // invoice number (simple timestamp-based)
  const invoiceNumber = `INV-${Date.now()}`;

  const invoiceDoc = {
    invoiceNumber,
    customerName,
    customerPhone,
    customerEmail,
    items,
    tax,
    subTotal,
    totalAmount,
    language,
    status: "Pending",
    createdBy: req.user?._id ?? null, // set when auth middleware supplies req.user
  };

  const invoice = await Invoice.create(invoiceDoc);

  // generate PDF
  try {
    const pdfUrl = await generatePDF(invoice);
    invoice.pdfUrl = pdfUrl;
    await invoice.save();
  } catch (err) {
    console.error("PDF generation failed:", err);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, invoice, "Invoice created successfully"));
});

// get all invoices
const getInvoices = asyncHandler(async (req, res) => {
  const filter = req.user?._id ? { createdBy: req.user._id } : {};
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, invoices, "Invoices fetched successfully"));
});

// get single invoice
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
 * generateInvoicePDF
 * POST /api/invoices/:id/pdf
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
