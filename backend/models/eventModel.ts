import mongoose from "mongoose";

const subEventTrackMongooseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sub-event name is required"],
      trim: true,
      maxlength: [50, "Sub-event name cannot exceed 50 characters"],
    },
    limit: {
      type: Number,
      required: [true, "Limit is required"],
      min: [1, "Limit must be at least 1"],
      max: [10000, "Limit cannot exceed 10,000"],
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    comments: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    eventDate: {
      type: String,
      required: [true, "Event date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^\d{2}:\d{2}$/, "Start time must be in HH:mm format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^\d{2}:\d{2}$/, "End time must be in HH:mm format"],
    },
    venue: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Venue cannot exceed 200 characters"],
    },
    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Location cannot exceed 1000 characters"],
    },
    technical: [subEventTrackMongooseSchema],
    nonTechnical: [subEventTrackMongooseSchema],
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
      min: [0, "Amount cannot be negative"],
      max: [100000, "Amount cannot exceed 100,000"],
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
