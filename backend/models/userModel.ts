import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    eventsApplied: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    profile_image_url: {
      type: String,
    },
    profile_file_id: {
      type: String,
    },
    isHost: { type: Boolean },
    phone: { type: String, default: "" },
    roleType: { type: String, default: "" },
    college: { type: String, default: "" },
    state: { type: String, default: "" },
    district: { type: String, default: "" },
    heardFrom: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
