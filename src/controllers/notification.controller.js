import asyncHandler from "../utils/async-handler.js";

export const sendWhatsappMessage = asyncHandler(async (req, res) => {
  console.log("📲 sendWhatsappMessage controller called");
  console.log("📋 Request body:", req.body);

  const { to, message } = req.body;

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

  // Replace with real WhatsApp API call
  console.log("🤖 Simulating WhatsApp API call...");

  res.status(200).json({
    success: true,
    message: "WhatsApp message sent (stub)",
    data: { to, message },
  });

  console.log("✅ Response sent successfully");
});

export const sendInvoiceEmail = asyncHandler(async (req, res) => {
  console.log("📧 sendInvoiceEmail controller called");
  console.log("📋 Request body:", req.body);

  const { to, subject, html, invoiceId } = req.body;

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
