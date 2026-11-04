import { Router } from "express";
import {
  addModerator,
  removeModerator,
  approveRequest,
  createGroup,
  getGroupByEventId,
  getGroupInfo,
  getGroupJoinRequests,
  getEventJoinRequests,
  getGroups,
  getUserEventRequestStatus,
  getUserRequests,
  joinRequest,
} from "../controllers/groupController.js";
import protect from "../middleware/protect.js";
import { isAdmin } from "../middleware/isAdminOrModerator.js";

const router = Router();

router.post("/create", protect, isAdmin, createGroup);
router.post("/addModerator", protect, isAdmin, addModerator);
router.post("/removeModerator", protect, isAdmin, removeModerator);
router.get("/", protect, getGroups);
router.post("/request", protect, joinRequest);
router.post("/batch-request", protect, joinRequest);
router.post("/approve", protect, approveRequest);
router.get("/r/request", protect, getGroupJoinRequests);
router.get("/events/:eventId/requests", protect, getEventJoinRequests);
router.get("/status/:eventId", protect, getUserEventRequestStatus);
router.get("/user/requests/:eventId?", protect, getUserRequests);
router.get("/byEvent/:eventId", getGroupByEventId);
router.get("/:groupId", getGroupInfo);

export default router;
