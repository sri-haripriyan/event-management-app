import Event from "../models/eventModel.js";
import Like from "../models/likeModel.js";
import logger from '../utils/logger.js'

export const toggleLike = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const existingLike = await Like.findOne({ userId, eventId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });

      await Event.findByIdAndUpdate(eventId, {
        $pull: { likes: userId },
      });

      return res.status(200).json({ success: true, liked: false });
    } else {
      await Like.create({ userId, eventId });

      await Event.findByIdAndUpdate(eventId, {
        $addToSet: { likes: userId },
      });

      return res.status(200).json({ success: true, liked: true });
    }
  } catch (error) {
    logger.error("toggleLike error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLikeCount = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const userLike = userId ? await Like.findOne({ userId, eventId }) : null;
    const liked = !!userLike;

    res.status(200).json({ likes: event.likes, liked });
  } catch (error) {
    logger.error("get like counts", error);
    res.status(500).json({ message: "Server error", error });
  }
};
