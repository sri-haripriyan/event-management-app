import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

joinRequestSchema.index({ user: 1, group: 1 }, { unique: true });

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);

export default JoinRequest;
