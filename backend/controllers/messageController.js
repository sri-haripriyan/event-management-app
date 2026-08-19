import Group from "../models/groupModel.js";
import Message from "../models/messageModel.js";
import { io } from "../socket/socket.js";
import logger from '../utils/logger.js'

export const sendMessage = async (req, res) => {
  const { message, groupId } = req.body;
  const user = req.user;

  try {
    const group = await Group.findById(groupId);
    if (!group.members.includes(user._id)) {
      res
        .status(403)
        .json({ error: "unauthorized no allowed to send message" });
      return;
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
    if (!group.members.includes(user._id)) {
      res
        .status(403)
        .json({ message: "unauthorized no allowed to get message" });
      return;
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
