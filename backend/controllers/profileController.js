import Event from "../models/eventModel.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";
export const uploadProfilePhoto = async (req, res) => {
	try {
		const imageUrl = req.file.path;
		const user = await User.findByIdAndUpdate(
			req.user._id,
			{
				profile_image_url: imageUrl,
			},
			{ new: true }
		);

		res.json({
			message: "Image uploaded successfully",
			user: {
				_id: user._id,
				userName: user.userName,
				email: user.email,
				profile_image_url: imageUrl,
			},
		});
	} catch (error) {
		logger.error("Upload profile photo controller error" + error.message);
		return res.status(500).json({ error: error.message });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { userName, email, password, confirmPassword } = req.body;
		console.log(req.user);
		let updateFields = {};
		if (userName !== req.user.userName) {
			if (await User.findOne({ userName }))
				return res.status(400).json({ message: "Username already exists" });
			updateFields.userName = userName;
		}
		if (email !== req.user.email) {
			if (await User.findOne({ email }))
				return res.status(400).json({ message: "Email already exists" });
			updateFields.email = email;
		}

		if (password) {
			if (password !== confirmPassword) {
				return res.status(400).json({ message: "Password mismatch" });
			}
			const salt = await bcrypt.genSalt(10);
			updateFields.password = await bcrypt.hash(password, salt);
		}

		const updatedUser = await User.findByIdAndUpdate(req.user._id, updateFields, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			user: {
				_id: req.user._id,
				userName: updatedUser.userName,
				email: updatedUser.email,
				profile_image_url: updatedUser.profile_image_url,
			},
			message: "Profile updated successfully",
		});
	} catch (error) {
		logger.error("Update profile controller error" + error);
		return res.status(500).json({ error: error.message });
	}
};

export const getPanelData = async (req, res) => {
	try {
		const [eventsCreated, user] = await Promise.all([
			Event.find({ userId: req.user._id }).populate("userId", "userName").sort({ likes: -1 }),
			User.findById(req.user._id),
		]);

		res.status(200).json({
			eventsCreated: eventsCreated.length,
			eventsParticipated: user.eventsApplied.length,
			most_liked_events: eventsCreated,
		});
	} catch (error) {
		logger.error("Get panel data controller error" + error);
		return res.status(500).json({ error: error.message });
	}
};
