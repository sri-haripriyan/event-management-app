import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import { io, onlineUsers } from "../socket/socket.js";
import logger from "./logger.js";

interface CreateNotificationParams {
  userId: any;
  title: string;
  message: string;
  type?: "welcome" | "event_created" | "event_registration" | "info";
  eventId?: any;
  subEventName?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    // If running in a test without MongoDB connection and create has not been mocked, avoid hanging
    if (
      mongoose.connection.readyState === 0 &&
      (Notification.create as any) === (mongoose.Model as any).create
    ) {
      return null;
    }

    const notification = await Notification.create({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      eventId: params.eventId || null,
      subEventName: params.subEventName || "",
      isRead: false,
    });

    const userSocketId = onlineUsers[params.userId?.toString()];
    if (userSocketId) {
      io.to(userSocketId).emit("new_notification", notification);
    }

    return notification;
  } catch (error: any) {
    logger.error("Error creating notification: " + error?.message);
    return null;
  }
};
