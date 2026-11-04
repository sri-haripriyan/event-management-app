import Group from "../models/groupModel.js";
import Message from "../models/messageModel.js";
import { io } from "../socket/socket.js";
import logger from '../utils/logger.js'

export const sendMessage = async (req, res) => {
  const { message, groupId } = req.body;
  const user = req.user;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    const userIdStr = user._id.toString();
    const isMember = (group.members || []).some(
      (m: any) => (m?._id || m)?.toString() === userIdStr
    );
    const isAdmin = (group.admin?._id || group.admin)?.toString() === userIdStr;
    const isModerator = (group.moderators || []).some(
      (m: any) => (m?._id || m)?.toString() === userIdStr
    );

    if (group.isHead) {
      if (!isAdmin && !isModerator && user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Unauthorized: only event admin and moderators can send messages in this group" });
      }
    } else if (!isMember && !isAdmin && !isModerator && user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized: not allowed to send message" });
    }
    const newMessage = await Message.create({
      groupId,
      senderId: user._id,
      message,
    });
    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "-password"
    );
    io.to(groupId).emit("newMessage", populatedMessage);
    res.status(200).json(populatedMessage);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "error sending message" });
  }
};
export const getMessages = async (req, res) => {
  const { groupId } = req.params;
  const user = req.user;
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    const userIdStr = user._id.toString();
    const isMember = (group.members || []).some(
      (m: any) => (m?._id || m)?.toString() === userIdStr
    );
    const isAdmin = (group.admin?._id || group.admin)?.toString() === userIdStr;
    const isModerator = (group.moderators || []).some(
      (m: any) => (m?._id || m)?.toString() === userIdStr
    );

    if (group.isHead) {
      if (!isAdmin && !isModerator && user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Unauthorized: only event admin and moderators can view messages in this group" });
      }
    } else if (!isMember && !isAdmin && !isModerator && user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: not allowed to get message" });
    }
    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .populate("senderId", ["-password"]);

    io.to(groupId).emit("messagesFetched", { user: user._id });
    res.status(200).json(messages);
  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: "error in get messages" });
  }
};
