import Notification from "../models/notificationModel.js";
import logger from "../utils/logger.js";

export const getUserNotifications = async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .populate("eventId", "title imageUrl")
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (error: any) {
    logger.error("Error fetching notifications: " + error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const markNotificationAsRead = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error: any) {
    logger.error("Error marking notification as read: " + error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const markAllNotificationsAsRead = async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error: any) {
    logger.error("Error marking all notifications as read: " + error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const deleteNotification = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    logger.error("Error deleting notification: " + error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
