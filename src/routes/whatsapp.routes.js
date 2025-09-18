// src/routes/whatsapp.routes.js
import { Router } from "express";
import {
  sendTextMessage,
  sendTemplateMessage,
  webhookVerify,
  webhookReceiver,
} from "../controllers/whatsapp.controller.js";

const router = Router();

// Send endpoints (protect with auth in production)
router.post("/send-text", sendTextMessage);
router.post("/send-template", sendTemplateMessage);

// Webhooks
router.get("/webhook", webhookVerify);
router.post("/webhook", webhookReceiver);

export default router;
