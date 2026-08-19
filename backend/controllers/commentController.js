import mongoose from "mongoose";
import Comment from "../models/commentModel.js";
import Event from "../models/eventModel.js";
export const createComment = async (req, res, next) => {
	try {
		const { comment, event, user } = req.body;
		const newComment = new Comment({
			comment,
			event,
			user,
		});
		await newComment.save();
		await Event.findByIdAndUpdate(event, {
			$inc: { comments: 1 },
		});
		res.status(200).json(newComment);
	} catch (error) {
		logger.error("createComment controller error" + error.message);
		res.status(400).json({ error: error.message });
	}
};
export const getPostComments = async (req, res, next) => {
	const { postId } = req.params;

	try {
		const comments = await Comment.find({
			event: postId,
		})
			.sort({
				createdAt: -1,
			})
			.populate("user", ["-password"]);
		res.status(200).json(comments);
	} catch (error) {
		logger.error("getpostComment controller error" + error.message);
		res.status(400).json({ error: error.message });
	}
};
