// src/utils/send-whatsapp.js
/**
 * WhatsApp Cloud API helper (ESM)
 *
 * Requires env:
 *  - WHATSAPP_ACCESS_TOKEN
 *  - WHATSAPP_PHONE_NUMBER_ID
 *  - (optional) WHATSAPP_API_VERSION (default: v17.0)
 *
 * Functions:
 *  - sendTextMessage(to, text)
 *  - sendTemplateMessage(to, templateName, language = 'en_US', components = [])
 *  - sendDocumentMessage(to, documentUrl, filename, caption?)
 *  - sendInvoiceMessage(to, invoiceUrl, invoiceNumber)  // convenience wrapper
 *
 * Notes:
 *  - "to" must be phone number in E.164 format without '+' (e.g. "919876543210") or with '+' (we normalize)
 *  - Template messages must be pre-approved in your Meta Business Manager WhatsApp templates.
 *  - Document (PDF) must be publicly accessible via HTTPS.
 */

import axios from "axios";

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v17.0";
const GRAPH_API_BASE = "https://graph.facebook.com";

if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
  console.warn(
    "WHATSAPP_ACCESS_TOKEN and/or WHATSAPP_PHONE_NUMBER_ID not set in env. WhatsApp functions will fail until set."
  );
}

const apiUrl = `${GRAPH_API_BASE}/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

/** Normalize phone number: remove spaces, dashes; strip leading + if present */
function normalizePhone(phone) {
  if (!phone) return phone;
  // convert to string
  let p = String(phone).trim();
  // remove spaces, dashes, parentheses
  p = p.replace(/[()\s-]+/g, "");
  // strip leading plus
  if (p.startsWith("+")) p = p.slice(1);
  return p;
}

/** Generic POST to WhatsApp Cloud API */
async function postToWhatsapp(payload, retries = 0) {
  try {
    const resp = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
    return resp.data;
  } catch (err) {
    // Simple retry logic for transient errors
    const status = err?.response?.status;
    const isTransient = !status || status >= 500 || status === 429;
    if (isTransient && retries > 0) {
      // small backoff
      await new Promise((r) => setTimeout(r, 500 * 2 ** (1 + (retries - 1))));
      return postToWhatsapp(payload, retries - 1);
    }

    // throw a normalized error
    const detail = err?.response?.data || err.message;
    const error = new Error("WhatsApp API request failed");
    error.details = detail;
    throw error;
  }
}

/**
 * Send a plain text message
 * to: phone (E.164, with or w/o +)
 * text: string
 */
export async function sendTextMessage(to, text) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error(
      "WhatsApp config missing (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)"
    );
  }
  if (!to || !text) throw new Error("sendTextMessage requires to and text");

  const toNormalized = normalizePhone(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "text",
    text: { body: text },
  };

  return postToWhatsapp(payload, 2);
}

/**
 * Send a template message (pre-approved templates)
 * to: phone
 * templateName: string (e.g. "order_confirmation")
 * language: locale code e.g. "en_US"
 * components: optional array following WhatsApp Cloud API template components format
 *
 * Example components for body parameter substitution:
 * [
 *   {
 *     type: "body",
 *     parameters: [{ type: "text", text: "Shreya" }, { type: "text", text: "INV-001" }]
 *   }
 * ]
 */
export async function sendTemplateMessage(
  to,
  templateName,
  language = "en_US",
  components = []
) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error(
      "WhatsApp config missing (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)"
    );
  }
  if (!to || !templateName)
    throw new Error("sendTemplateMessage requires to and templateName");

  const toNormalized = normalizePhone(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: components || [],
    },
  };

  return postToWhatsapp(payload, 2);
}

/**
 * Send a document (e.g., invoice PDF)
 * to: phone
 * documentUrl: public HTTPS URL (must be accessible)
 * filename: string (e.g., "invoice_INV-2025-001.pdf")
 * caption: optional short text
 */
export async function sendDocumentMessage(to, documentUrl, filename, caption) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error(
      "WhatsApp config missing (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)"
    );
  }
  if (!to || !documentUrl)
    throw new Error("sendDocumentMessage requires to and documentUrl");

  const toNormalized = normalizePhone(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "document",
    document: {
      link: documentUrl,
      filename: filename || "document.pdf",
    },
  };

  // Add caption if provided (Cloud API supports caption for some media types; document captions may vary)
  if (caption) payload.document.caption = caption;

  return postToWhatsapp(payload, 2);
}

/**
 * Convenience: send invoice message (text + PDF)
 * - Sends a short text message followed by a document message with invoice PDF (two calls)
 * - You can also combine into a template if you have one approved for invoice notifications.
 *
 * invoiceUrl must be HTTPS and publicly accessible by WhatsApp servers.
 */
export async function sendInvoiceMessage(
  to,
  { invoiceNumber, invoiceUrl, amount, dueDate }
) {
  // 1) Send short text notification
  const text = `Invoice ${invoiceNumber} for ${amount} is ready. Due: ${dueDate}. Download: ${invoiceUrl}`;
  await sendTextMessage(to, text);

  // 2) Send document (PDF)
  // Note: Some clients show document preview; some may block downloads if not accessible.
  await sendDocumentMessage(
    to,
    invoiceUrl,
    `invoice_${invoiceNumber}.pdf`,
    `Invoice ${invoiceNumber}`
  );
  return { success: true };
}

/** Default export with helpers */
export default {
  sendTextMessage,
  sendTemplateMessage,
  sendDocumentMessage,
  sendInvoiceMessage,
};
