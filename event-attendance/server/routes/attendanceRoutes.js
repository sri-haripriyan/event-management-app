import express from "express";
import {
	getAttendance,
	updateAttendance,
	closeAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.route("/:eventId").get(getAttendance);
router.route("/scan/:eventId").post(updateAttendance);
router.route("/end").post(closeAttendance);
export default router;
