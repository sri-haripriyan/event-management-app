import { Router } from "express";
import protect from "../middleware/protect.js";
import {
  capturePayment,
  createOrder,
  verifyEventApplied,
  verifyPayment,
} from "../controllers/paymentControllers.js";

const router = Router();

router.post("/create-order", protect, createOrder);
router.post("/capture-payment", capturePayment);
router.post("/verify-payment", protect, verifyPayment);
router.get("/:eventId", protect, verifyEventApplied);

export default router;
