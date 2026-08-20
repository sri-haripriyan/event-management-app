import { Router } from "express";
import protect from "../middleware/protect.js";
import {
	getPanelData,
	updateProfile,
	uploadProfilePhoto,
} from "../controllers/profileController.js";
import { upload } from "../configs/cloudinary.js";

const router = Router();
router
	.route("/upload")
	.post(protect, upload.single("image"), uploadProfilePhoto);
router.route("/").get(protect, getPanelData).put(protect, updateProfile);

export default router;
