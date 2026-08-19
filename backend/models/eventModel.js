import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    comments: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventDate: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    technical: { type: [] },
    nonTechnical: { type: [] },
    fileId: {
      type: String,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: 0,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    swags: {
      type: Boolean,
      default: false,
    },
    refreshments: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
