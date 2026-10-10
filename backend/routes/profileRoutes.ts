import { Router } from "express";
import protect from "../middleware/protect.js";
import {
	getPanelData,
	updateProfile,
	uploadProfilePhoto,
	scanTicketCheckIn,
} from "../controllers/profileController.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"));
		}
	},
});

const router = Router();
router
	.route("/upload")
	.post(protect, upload.single("image"), uploadProfilePhoto);
router.route("/").get(protect, getPanelData).put(protect, updateProfile);
router.route("/scan-ticket").post(protect, scanTicketCheckIn);

export default router;
