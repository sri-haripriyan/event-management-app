import {
  createComment,
  getPostComments,
} from "../controllers/commentController.js";
import express from "express";

const router = express.Router();

router.post("/create", createComment);
router.get("/getPostComments/:postId", getPostComments);

export default router;
