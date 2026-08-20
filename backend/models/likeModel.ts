import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		eventId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
		},
	},
	{ timestamps: true }
);

const Like = mongoose.model("Like", likeSchema);

export default Like;
