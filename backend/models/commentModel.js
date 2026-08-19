import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		event: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
		},
		comment: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
