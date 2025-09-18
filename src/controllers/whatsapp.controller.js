// src/controllers/whatsapp.controller.js
import axios from "axios";

const WHATSAPP_API_BASE = "https://graph.facebook.com/v17.0"; // adjust version if needed
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "my_verify_token";

if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
  console.warn(
    "⚠️ WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set in env"
  );
}

const apiUrl = (path = "") =>
  `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}${path ? `/${path}` : ""}`;

export const sendTextMessage = async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) {
      return res
        .status(400)
        .json({ success: false, message: "to and text are required" });
    }

    const url = `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}/messages`;
    const resp = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({ success: true, data: resp.data });
  } catch (err) {
    console.error("sendTextMessage error:", err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    return res
      .status(status)
      .json({ success: false, error: err?.response?.data || err.message });
  }
};

export const sendTemplateMessage = async (req, res) => {
  try {
    const { to, template } = req.body;
    if (!to || !template || !template.name || !template.language) {
      return res.status(400).json({
        success: false,
        message: "to and template (name, language) required",
      });
    }

    const url = `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template,
    };

    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({ success: true, data: resp.data });
  } catch (err) {
    console.error(
      "sendTemplateMessage error:",
      err?.response?.data || err.message
    );
    const status = err?.response?.status || 500;
    return res
      .status(status)
      .json({ success: false, error: err?.response?.data || err.message });
  }
};

export const webhookVerify = (req, res) => {
  const MODE = req.query["hub.mode"];
  const VERIFY_TOKEN = req.query["hub.verify_token"];
  const CHALLENGE = req.query["hub.challenge"];

  if (MODE && VERIFY_TOKEN) {
    if (
      MODE === "subscribe" &&
      VERIFY_TOKEN === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      console.log("✅ WEBHOOK_VERIFIED");
      return res.status(200).send(CHALLENGE);
    } else {
      return res.status(403).send("Forbidden - verify token mismatch");
    }
  }
  res.status(400).send("Bad Request");
};

export const webhookReceiver = async (req, res) => {
  try {
    res.status(200).send("EVENT_RECEIVED"); // ACK immediately

    const body = req.body;

    if (body.object) {
      body.entry?.forEach((entry) => {
        const changes = entry.changes || [];
        changes.forEach((change) => {
          const value = change.value;

          if (value.messages) {
            value.messages.forEach((message) => {
              const from = message.from;
              const msgBody = message.text?.body || message.type;
              console.log(`📩 Message from ${from}:`, msgBody);
            });
          }

          if (value.statuses) {
            value.statuses.forEach((status) => {
              console.log("📊 Message status update:", status);
            });
          }
        });
      });
    } else {
      console.log("Webhook received unknown object", body);
    }
  } catch (err) {
    console.error("webhookReceiver error:", err);
  }
};
