import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { getLogs, clearLogs } from "../controllers/logController.js";

const router = express.Router();

router.get("/logs", adminAuth, getLogs);
router.delete("/logs", adminAuth, clearLogs);

export default router;
