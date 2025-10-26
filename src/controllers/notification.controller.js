// src/controllers/notifications.controller.js
import asyncHandler from "../utils/async-handler.js";
import Invoice from "../models/invoice.model.js";
import ApiError from "../utils/api-error.js";

/**
 * Send WhatsApp message
 * Body: { to?, message, invoiceId? }
 * If invoiceId is provided and 'to' is missing, it uses invoice.customerPhone
 */
export const sendWhatsappMessage = asyncHandler(async (req, res) => {
  console.log("📲 sendWhatsappMessage controller called");
  console.log("📋 Request body:", req.body);

  let { to, message, invoiceId } = req.body;

  if (invoiceId && !to) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new ApiError(404, "Invoice not found");
    to = invoice.customerPhone;
  }

  if (!to || !message) {
    console.log("❌ Validation failed: Missing to or message");
    return res.status(400).json({
      success: false,
      message: "Recipient number and message required",
    });
  }

  console.log("✅ Validation passed");
  console.log("📞 Recipient:", to);
  console.log("💭 Message:", message);

  // TODO: Replace with real WhatsApp API integration
  console.log("🤖 Simulating WhatsApp API call...");

  if (invoiceId) {
    await Invoice.findByIdAndUpdate(invoiceId, { whatsappStatus: "sent" });
  }

  res.status(200).json({
    success: true,
    message: "WhatsApp message sent (stub)",
    data: { to, message, invoiceId },
  });

  console.log("✅ Response sent successfully");
});

/**
 * Send invoice email
 * Body: { to?, subject, html, invoiceId? }
 * If invoiceId is provided and 'to' is missing, it uses invoice.customerEmail
 */
export const sendInvoiceEmail = asyncHandler(async (req, res) => {
  console.log("📧 sendInvoiceEmail controller called");
  console.log("📋 Request body:", req.body);

  let { to, subject, html, invoiceId } = req.body;

  if (invoiceId && !to) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new ApiError(404, "Invoice not found");
    to = invoice.customerEmail;
  }

  if (!to || !subject || !html) {
    console.log("❌ Validation failed: Missing required email fields");
    return res.status(400).json({
      success: false,
      message: "Recipient email, subject, and HTML content are required",
    });
  }

  console.log("✅ Email validation passed");
  console.log("📩 To:", to);
  console.log("📋 Subject:", subject);
  console.log("📄 Invoice ID:", invoiceId);

  console.log("🤖 Simulating email sending...");

  res.status(200).json({
    success: true,
    message: "Invoice email sent (stub)",
    data: { to, subject, invoiceId },
  });

  console.log("✅ Email response sent");
});

// ✅ Alias for backwards compatibility with route import
export const sendInvoiceWhatsapp = sendWhatsappMessage;
