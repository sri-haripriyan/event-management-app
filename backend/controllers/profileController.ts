import Event from "../models/eventModel.js";
import User from "../models/userModel.js";
import Application from "../models/applicationModel.js";
import Payment from "../models/paymentModel.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";
import { InputFile } from "node-appwrite/file";
import { ID } from "node-appwrite";
import { storage, bucketId, projectId, endpoint } from "../configs/appwrite.js";

export const uploadProfilePhoto = async (req: any, res: any) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No image file provided" });
		}

		if (!req.file.mimetype?.startsWith("image/")) {
			return res.status(400).json({ error: "Only image files (JPEG, PNG, WebP) are allowed" });
		}

		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Identify old file reference if present
		let oldFileId = (user as any).profile_file_id;
		if (!oldFileId && user.profile_image_url) {
			const match = user.profile_image_url.match(/files\/([^/]+)\/(?:view|preview|download)/);
			if (match && match[1]) {
				oldFileId = match[1];
			}
		}

		// 1. Upload new image to Appwrite storage
		let uploadedFile: any;
		try {
			uploadedFile = await storage.createFile(
				bucketId,
				ID.unique(),
				InputFile.fromBuffer(req.file.buffer, req.file.originalname || "avatar.png")
			);
		} catch (uploadErr: any) {
			logger.error("Appwrite avatar upload failed: " + (uploadErr?.message || uploadErr));
			return res.status(500).json({ error: "Failed to upload image to Appwrite storage" });
		}

		const link = `${endpoint}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${projectId}`;

		// 2. Update user document in database
		try {
			user.profile_image_url = link;
			(user as any).profile_file_id = uploadedFile.$id;
			await user.save();
		} catch (dbErr: any) {
			// Avoid orphaned file: clean up uploaded file in Appwrite if database save fails
			logger.error("Database update error for avatar: " + (dbErr?.message || dbErr));
			try {
				await storage.deleteFile(bucketId, uploadedFile.$id);
			} catch (cleanErr: any) {
				logger.warn("Failed to clean up orphaned Appwrite file: " + cleanErr?.message);
			}
			return res.status(500).json({ error: "Failed to update profile record in database" });
		}

		// 3. Remove previous Appwrite avatar file to prevent orphan accumulation
		if (oldFileId && oldFileId !== uploadedFile.$id) {
			try {
				await storage.deleteFile(bucketId, oldFileId);
				logger.info(`Deleted old Appwrite avatar file: ${oldFileId}`);
			} catch (delErr: any) {
				logger.warn("Could not delete old Appwrite avatar (may already be gone): " + delErr?.message);
			}
		}

		return res.status(200).json({
			message: "Profile image updated successfully",
			user: {
				_id: user._id,
				userName: user.userName,
				email: user.email,
				profile_image_url: link,
			},
		});
	} catch (error: any) {
		logger.error("Upload profile photo controller error: " + error.message);
		return res.status(500).json({ error: error.message });
	}
};

export const updateProfile = async (req: any, res: any) => {
	try {
		const { userName, email, password, confirmPassword } = req.body;
		let updateFields: any = {};
		if (userName && userName !== req.user.userName) {
			if (await User.findOne({ userName }))
				return res.status(400).json({ message: "Username already exists" });
			updateFields.userName = userName;
		}
		if (email && email !== req.user.email) {
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
	} catch (error: any) {
		logger.error("Update profile controller error: " + error.message);
		return res.status(500).json({ error: error.message });
	}
};

export const getPanelData = async (req: any, res: any) => {
	try {
		const userId = req.user._id;

		const [eventsCreated, user, applications, payments, savedEvents] = await Promise.all([
			Event.find({ userId }).populate("userId", "userName").sort({ likes: -1 }),
			User.findById(userId),
			Application.find({ userId }).populate("eventId").sort({ createdAt: -1 }),
			Payment.find({ userId }).populate("eventId").sort({ createdAt: -1 }),
			Event.find({ likes: userId }),
		]);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Deduplicate and aggregate participated events
		const eventMap = new Map<string, any>();

		// 1. Applications
		applications.forEach((app: any) => {
			if (app.eventId && app.eventId._id) {
				const id = app.eventId._id.toString();
				eventMap.set(id, {
					event: app.eventId,
					isAttended: app.isAttended ?? true,
					appliedTo: app.appliedTo || [],
					status: app.isAttended ? "Checked In" : "Attended",
					createdAt: app.createdAt || app.eventId.createdAt,
				});
			}
		});

		// 2. Payments
		payments.forEach((pay: any) => {
			if (pay.eventId && pay.eventId._id) {
				const id = pay.eventId._id.toString();
				const existing = eventMap.get(id);
				if (existing) {
					existing.payment = pay;
					existing.paid = true;
				} else {
					eventMap.set(id, {
						event: pay.eventId,
						isAttended: true,
						status: "Checked In",
						payment: pay,
						paid: true,
						createdAt: pay.createdAt || pay.eventId.createdAt,
					});
				}
			}
		});

		// 3. User eventsApplied array (if any direct references exist)
		if (user?.eventsApplied?.length) {
			const directEvents = await Event.find({ _id: { $in: user.eventsApplied } });
			directEvents.forEach((ev: any) => {
				const id = ev._id.toString();
				if (!eventMap.has(id)) {
					eventMap.set(id, {
						event: ev,
						isAttended: true,
						status: "Attended",
						paid: ev.paid,
						createdAt: ev.createdAt,
					});
				}
			});
		}

		// Map to standard format
		const participatedEvents = Array.from(eventMap.values()).map((item: any) => {
			const ev = item.event;
			const refCode = `#LUM-${ev._id.toString().slice(-5).toUpperCase()}`;
			const isPaid = ev.paid || Boolean(item.payment);
			const amount = ev.amount || (isPaid ? 99 : 0);

			return {
				_id: ev._id,
				title: ev.title,
				description: ev.description,
				imageUrl: ev.imageUrl,
				eventDate: ev.eventDate,
				startTime: ev.startTime,
				endTime: ev.endTime,
				paid: isPaid,
				amount: amount,
				reference: refCode,
				status: item.status || "Attended",
				isAttended: item.isAttended ?? true,
				location: ev.location || (ev.nonTechnical?.length ? "Lumina Hall Studio" : "Online / Virtual"),
				createdAt: item.createdAt || ev.createdAt,
			};
		});

		// Calculate upcoming count (events with future date)
		const now = new Date();
		const upcomingCount = participatedEvents.filter((e) => {
			if (!e.eventDate) return false;
			const d = new Date(e.eventDate);
			return !isNaN(d.getTime()) && d > now;
		}).length;

		res.status(200).json({
			user: {
				_id: user._id,
				userName: user.userName,
				email: user.email,
				profile_image_url: user.profile_image_url,
				isHost: user.isHost,
			},
			eventsCreated: eventsCreated.length,
			eventsParticipated: participatedEvents.length,
			most_liked_events: eventsCreated,
			participatedEvents,
			stats: {
				attended: participatedEvents.length,
				upcoming: upcomingCount,
				saved: savedEvents.length,
			},
		});
	} catch (error: any) {
		logger.error("Get panel data controller error: " + error.message);
		return res.status(500).json({ error: error.message });
	}
};
