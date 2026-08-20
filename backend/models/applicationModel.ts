import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
	{
		eventId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		isAttended: {
			type: Boolean,
			default: false,
		},
		appliedTo: {
			type: [],
			required: true,
		},
	},
	{ timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
