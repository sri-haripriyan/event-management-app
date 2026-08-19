import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import Event from "../models/eventModel.js";
import Group from "../models/groupModel.js";
import logger from '../utils/logger.js'

export const signUp = async (req, res) => {
  const { userName, email, password } = req.body;
  try {
    const userExists = await User.findOne({ userName });
    if (userExists) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      userName,
      email,
      password: hashedPassword,
    });

    generateToken(res, user._id);
    const savedUser = await user.save();
    if (user) {
      res.status(201).json({
        _id: savedUser._id,
        userName,
        email,
        profile_image_url: user.profile_image_url,
      });
    } else {
      return res.status(400).json({ error: error.message });
    }
  } catch (error) {
    logger.error("Signup controller error" + error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const userExists = await User.findOne({ userName });
    if (userExists && (await bcrypt.compare(password, userExists.password))) {
      const event = await Event.findOne({ userId: userExists._id });
      const isHost = event ? true : false;

      generateToken(res, userExists._id);
      res.status(200).json({
        _id: userExists._id,
        userName: userExists.userName,
        email: userExists.email,
        groups: userExists.groups,
        eventsApplied: userExists.eventsApplied,
        isHost,
      });
    } else {
      return res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    logger.error("Login controller error" + error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("auth", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout controller error" + error.message);
    res.status(500).json({ error: error.message });
  }
};

export const checkRoles = async (req, res) => {
  try {
    const userId = req.user._id;
    const [isHost, isModerator] = await Promise.all([
      Event.findOne({ userId }), // Check if the user is a Host
      Group.findOne({ moderators: userId }), // Check if the user is a Moderator
    ]);

    const host = isHost ? true : false;
    const moderator = isModerator ? true : false;

    res.status(200).json({ message: "success", host, moderator });
  } catch (error) {
    logger.error("checkRoles" + error.message);
    res.status(500).json({ error: error.message });
  }
};
