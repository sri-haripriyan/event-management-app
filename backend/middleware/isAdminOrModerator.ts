import Group from "../models/groupModel.js";
import Event from "../models/eventModel.js";

const isAdminOrModerator = async (req: any, res: any, next: any) => {
  const user = req.user;
  const groupId =
    req.body?.groupId ||
    req.body?.id ||
    req.body?.group ||
    req.body?.subEventId ||
    req.params?.groupId ||
    req.params?.id ||
    req.query?.groupId;
  try {
    if (!groupId) {
      if (user?.role === "admin") return next();
      return res.status(400).json({ message: "Group ID is required" });
    }
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUserId = user?._id?.toString();
    const groupAdminId = group.admin ? (group.admin._id || group.admin).toString() : null;
    const isMod =
      Array.isArray(group.moderators) &&
      group.moderators.some((m: any) => (m?._id || m)?.toString() === currentUserId);

    let isEventAdmin = false;
    if (group.eventId) {
      const event = await Event.findById(group.eventId);
      if (event?.userId && (event.userId._id || event.userId).toString() === currentUserId) {
        isEventAdmin = true;
      }
    }

    const isAuthorized =
      (groupAdminId && groupAdminId === currentUserId) ||
      isEventAdmin ||
      isMod ||
      user?.role === "admin";

    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: "Error authorizing user", error: err.message });
  }
};

const isAdmin = async (req: any, res: any, next: any) => {
  const user = req.user;
  const groupId =
    req.body?.groupId ||
    req.body?.id ||
    req.body?.group ||
    req.body?.subEventId ||
    req.params?.groupId ||
    req.params?.id ||
    req.query?.groupId;
  try {
    if (!groupId) {
      if (user?.role === "admin") return next();
      return res.status(400).json({ message: "Group ID is required" });
    }
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUserId = user?._id?.toString();
    const groupAdminId = group.admin ? (group.admin._id || group.admin).toString() : null;

    let isEventAdmin = false;
    if (group.eventId) {
      const event = await Event.findById(group.eventId);
      if (event?.userId && (event.userId._id || event.userId).toString() === currentUserId) {
        isEventAdmin = true;
      }
    }

    const isAuthorized =
      (groupAdminId && groupAdminId === currentUserId) ||
      isEventAdmin ||
      user?.role === "admin";

    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: "Error authorizing user", error: err.message });
  }
};

export { isAdminOrModerator, isAdmin };
