import { Router } from "express";
import {
	scanTicketCheckIn,
	getEventAttendance,
} from "../controllers/ticketController.js";
import protect from "../middleware/protect.js";

const ticketRoutes = Router();

// Scan ticket / mark attendance
ticketRoutes.route("/scan-ticket").post(protect, scanTicketCheckIn);
ticketRoutes.route("/scan/:eventId").post(protect, scanTicketCheckIn);

// Event attendance roster for organizers
ticketRoutes.route("/attendance/:eventId").get(protect, getEventAttendance);
ticketRoutes.route("/event/:eventId/attendance").get(protect, getEventAttendance);

export default ticketRoutes;