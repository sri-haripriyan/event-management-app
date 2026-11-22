import { Router } from "express";
import protect from "../middleware/protect.js";
import {
  capturePayment,
  createOrder,
  getEventPaymentHistory,
  getPaymentSummary,
  verifyEventApplied,
  verifyPayment,
} from "../controllers/paymentControllers.js";

const router = Router();

// History endpoints must come before dynamic /:eventId to prevent express path collision
router.get("/history/:eventId", protect, getEventPaymentHistory);
router.get("/history", protect, getEventPaymentHistory);

// Summary endpoints must come before dynamic /:eventId to prevent express path collision
router.get("/summary/:eventId", protect, getPaymentSummary);
router.post("/summary", protect, getPaymentSummary);
router.post("/create-order", protect, createOrder);
router.post("/capture-payment", capturePayment);
router.post("/verify-payment", protect, verifyPayment);
router.get("/:eventId", protect, verifyEventApplied);

export default router;
