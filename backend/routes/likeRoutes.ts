import { Router } from "express";
import { toggleLike, getLikeCount } from "../controllers/LikeController.js";
import protect from "../middleware/protect.js";

const router = Router();

router.post("/:eventId", protect, toggleLike);
router.get("/:eventId", getLikeCount);

export default router;
