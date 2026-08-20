import express from "express";
import {
  login,
  logout,
  signUp,
  checkRoles,
} from "../controllers/authController.js";
import protect from "../middleware/protect.js";
const router = express.Router();

router.route("/signup").post(signUp);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/check-role").get(protect, checkRoles);

export default router;
