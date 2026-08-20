import express from "express";
import {
	createEvent,
	updateEvent,
	deleteEvent,
	getEvents,
	getEventById,
} from "../controllers/eventController.js";
import multer from "multer";

import protect from "../middleware/protect.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/").get(getEvents);
router.route("/").post(protect, upload.single("file"), createEvent);
router.route("/:id").delete(protect, deleteEvent);
router.route("/:id").get(getEventById);
router.route("/:id").put(protect, upload.single("file"), updateEvent);
export default router;
