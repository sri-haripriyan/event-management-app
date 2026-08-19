import Group from "../models/groupModel.js";
import JoinRequest from "../models/requestModel.js";
import User from "../models/userModel.js";
import { io, onlineUsers } from "../socket/socket.js";
import logger from "../utils/logger.js";
import Application from "../models/applicationModel.js";
import { addEmailToQueue } from "../queues/emailQueue.js";
export const createGroup = async (req, res) => {
	const { name, eventId, isHead } = req.body;

	try {
		// Check if the group already exists
		const existingGroup = await Group.findOne({ eventId });
		if (existingGroup) {
			return res.status(400).json({ message: "Group already exists" });
		}

		// Create a new group
		const newGroup = await Group.create({
			name,
			eventId,
			admin: req.user._id,
			members: [req.user._id],
			isHead,
		});

		res.status(201).json({
			message: "Group created successfully",
			group: newGroup,
		});
	} catch (err) {
		logger.error("create group error", err);
		res.status(500).json({ message: "Error creating group", error: err });
	}
};

export const addModerator = async (req, res) => {
	try {
		const { groupId, userId } = req.body;

		// Fetch group and user in parallel for efficiency
		const [group, user] = await Promise.all([
			Group.findById(groupId).lean(),
			User.findOne({ email: userId }).lean(),
		]);

		if (!group) return res.status(404).json({ message: "Group not found" });

		if (!group.admin.equals(req.user._id)) {
			return res.status(403).json({ message: "Only admin can add moderators" });
		}

		if (!user) return res.status(404).json({ message: "User not found" });

		if (group.moderators.includes(user._id)) {
			return res.status(400).json({ message: "User is already a moderator" });
		}
		const headGroup = await Group.findOne({
			eventId: group.eventId,
			isHead: true,
		});

		await Promise.all([
			Group.updateOne(
				{ _id: groupId },
				{ $addToSet: { moderators: user._id, members: user._id } }
			),
			Group.updateOne({ _id: headGroup._id }, { $addToSet: { members: user._id } }),
		]);

		return res.status(200).json({ message: "Moderator added successfully" });
	} catch (error) {
		logger.error("Error adding moderator:", error);
		return res.status(500).json({ message: "Server error", error });
	}
};

export const getGroupInfo = async (req, res) => {
	try {
		const group = await Group.findById(req.params.groupId)
			.populate("admin", ["-password"])
			.populate("moderators", ["-password"])
			.populate("members", ["-password"]);
		if (group == null) {
			return res.status(200).json({ message: "group Not Found" });
		}
		res.status(200).json(group);
	} catch (error) {
		logger.error("getGroupInfo controller error" + error.message);
		res.status(400).json({ error: error.message });
	}
};

export const getGroups = async (req, res) => {
	try {
		const userId = req.user._id; // User ID from the request
		const role = req.query.role || "member"; // Get role from query params, default to "member"

		const matchCondition =
			role === "admin"
				? { admin: userId } // Match groups where the user is an admin
				: { members: userId };

		const result = await Group.aggregate([
			{
				$match: matchCondition,
			},
			{
				$group: {
					_id: "$eventId", // Group by eventId
					totalGroups: { $sum: 1 }, // Count groups per eventId
					membersCount: { $sum: { $size: "$members" } }, // Sum total members per eventId
					groups: { $push: "$$ROOT" }, // Include all groups for each event
				},
			},
			{
				$unwind: "$groups", // Unwind groups to perform lookup
			},
			// Populate admin
			{
				$lookup: {
					from: "users", // Reference the User collection
					localField: "groups.admin",
					foreignField: "_id",
					as: "groups.admin",
				},
			},
			{
				$unwind: {
					path: "$groups.admin",
					preserveNullAndEmptyArrays: true,
				},
			},
			// Populate moderators
			{
				$lookup: {
					from: "users",
					localField: "groups.moderators",
					foreignField: "_id",
					as: "groups.moderators",
				},
			},
			// Populate members
			{
				$lookup: {
					from: "users",
					localField: "groups.members",
					foreignField: "_id",
					as: "groups.members",
				},
			},
			// Populate eventId
			{
				$lookup: {
					from: "events", // Reference the Event collection
					localField: "_id", // Since _id is now eventId
					foreignField: "_id",
					as: "eventDetails",
				},
			},
			{
				$unwind: {
					path: "$eventDetails",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: "$_id",
					eventDetails: { $first: "$eventDetails" }, // Attach populated event details
					totalGroups: { $first: "$totalGroups" },
					membersCount: { $first: "$membersCount" },
					groups: { $push: "$groups" }, // Re-group populated groups
				},
			},
		]);

		if (!result.length) {
			return res.status(200).json(result);
		}

		res.status(200).json(result);
	} catch (error) {
		logger.error("Error fetching grouped data:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const approveRequest = async (req, res) => {
	const { requestId, action } = req.body;

	try {
		const joinRequest = await JoinRequest.findById(requestId).populate("group");
		if (!joinRequest || joinRequest.status !== "pending") {
			return res.status(400).json({ message: "Invalid request" });
		}

		const group = joinRequest.group;
		joinRequest.status = action === "approve" ? "approved" : "rejected";

		if (action === "approve") {
			await Promise.all([
				joinRequest.save(),
				Group.findByIdAndUpdate(group._id, {
					$push: { members: joinRequest.user },
				}),
				User.findByIdAndUpdate(joinRequest.user, {
					$push: { groups: group._id },
				}),
			]);
			let application = await Application.findOne({
				eventId: group.eventId,
				userId: joinRequest.user,
			});
			if (application) {
				application.appliedTo.push(group.name);
				const updatedApplication = await application.save();
				logger.info("Updated application: " + updatedApplication);
				await addEmailToQueue(application._id);
			} else {
				const newApplication = await Application.create({
					eventId: group.eventId,
					userId: joinRequest.user,
					appliedTo: [group.name],
				});
				logger.info("Updated application: " + newApplication);
				await addEmailToQueue(newApplication._id);
			}
		} else {
			await joinRequest.save();
		}

		res.status(200).json({ message: `Join request ${action}ed` });
	} catch (err) {
		res.status(500).json({ message: "Error processing join request", error: err });
	}
};

export const joinRequest = async (req, res) => {
	try {
		const { groupId } = req.body;
		const userId = req.user._id;

		// Fetch only required fields to minimize data retrieval
		const group = await Group.findById(groupId).select("members requests admin");

		if (!group) {
			return res.status(404).json({ message: "Group not found" });
		}

		if (group.members.includes(userId) || group.requests.includes(userId)) {
			return res.status(400).json({
				message: "Request already sent or user already a member",
			});
		}

		// Push request and save in a single operation
		group.requests.push(userId);
		await Promise.all([
			group.save(),
			JoinRequest.create({ user: userId, group: groupId, admin: group.admin }),
		]);
		const adminId = group.admin.toString(); // Get admin's ID
		const adminSocketId = onlineUsers[adminId]; // Find admin's socket ID

		if (adminSocketId) {
			io.to(adminSocketId).emit("new_request", { groupId, userId });
		}

		return res.status(200).json({ message: "Request sent successfully" });
	} catch (error) {
		logger.error("Join Request Error:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const getGroupJoinRequests = async (req, res) => {
	try {
		const adminId = req.user._id;
		const requests =
			(await JoinRequest.find({ admin: adminId })
				.populate("user", ["-password"])
				.populate("group")) || [];

		res.status(200).json(requests);
	} catch (err) {
		logger.error("get group join request", err);
		res.status(500).json({ message: "Error fetching join requests", error: err });
	}
};

export const getGroupByEventId = async (req, res) => {
	try {
		const groups = await Group.find({ eventId: req.params.eventId });

		const filteredGroups = groups
			.filter((group) => !group.isHead)
			.map((group) => ({
				_id: group._id,
				name: group.name,
			}));

		if (filteredGroups.length === 0) {
			return res.status(404).json({ message: "No groups found" });
		}

		res.status(200).json(filteredGroups);
	} catch (error) {
		logger.error("getGroupByEventId controller error: " + error.message);
		res.status(400).json({ error: error.message });
	}
};
