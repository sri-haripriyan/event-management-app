import mongoose from "mongoose";

const groupSchema = mongoose.Schema(
	{
		name: { type: String, required: true },
		description: String,
		eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
		admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" }],
		isHead: { type: Boolean, required: true },
		limit: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
