import Event from "../models/eventModel.js";
import jwt from "jsonwebtoken";
import Group from "../models/groupModel.js";
import JoinRequest from "../models/requestModel.js";
import User from "../models/userModel.js";
import { io, onlineUsers } from "../socket/socket.js";
import logger from "../utils/logger.js";
import Application from "../models/applicationModel.js";
import { addEmailToQueue } from "../queues/emailQueue.js";
import { ensureApplicationQRCode } from "../utils/ticketQR.js";
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

export const approveRequest = async (req: any, res: any) => {
	const { requestId, action, status } = req.body;

	try {
		if (!requestId) {
			return res.status(400).json({ message: "requestId is required" });
		}

		const joinRequest = await JoinRequest.findById(requestId).populate("group");
		if (!joinRequest) {
			return res.status(404).json({ message: "Join request not found" });
		}

		const group = joinRequest.group as any;
		if (!group) {
			return res.status(404).json({ message: "Associated sub-event group not found" });
		}

		// Authorization check: User must be Event creator, group admin, group moderator, or host/admin
		if (req.user) {
			const userIdStr = req.user._id?.toString();
			const groupAdminId = (group.admin?._id || group.admin)?.toString();
			const isGroupAdmin = groupAdminId ? groupAdminId === userIdStr : false;
			const isGroupMod = Boolean(
				group.moderators?.some((m: any) => (m?._id || m)?.toString() === userIdStr)
			);
			const isSuperAdmin = req.user.role === "admin";

			let isEventCreator = false;
			if (!isGroupAdmin && !isGroupMod && !isSuperAdmin && group.eventId) {
				const event = await Event.findById(group.eventId).select("userId").lean();
				if (event) {
					const eventOwnerId = (event.userId as any)?._id?.toString() || event.userId?.toString();
					isEventCreator = eventOwnerId === userIdStr;
				}
			}

			if (groupAdminId || isEventCreator || isSuperAdmin) {
				if (!isGroupAdmin && !isGroupMod && !isEventCreator && !isSuperAdmin) {
					return res.status(403).json({
						message: "Access denied: Only event organizers or moderators can manage join requests",
					});
				}
			}
		}

		// Normalize target status
		let targetStatus: "approved" | "rejected" | "pending";
		const rawAction = (action || status || "").toString().toLowerCase().trim();
		if (rawAction === "approve" || rawAction === "approved") {
			targetStatus = "approved";
		} else if (rawAction === "reject" || rawAction === "rejected") {
			targetStatus = "rejected";
		} else if (rawAction === "pending") {
			targetStatus = "pending";
		} else {
			return res.status(400).json({ message: "Invalid action. Must be 'approve', 'reject', or 'pending'." });
		}

		if (targetStatus === "approved") {
			// Seat capacity check: prevent exceeding seat capacity (unless user is already a member)
			const isAlreadyMember = group.members?.some((m: any) => m?.toString() === joinRequest.user?.toString());
			const currentMembers = (group.members?.length || 0) - (group.moderators?.length || 0);

			if (!isAlreadyMember && group.limit && currentMembers >= group.limit) {
				return res.status(400).json({ message: "Sub-event participant limit reached" });
			}

			joinRequest.status = "approved";
			await Promise.all([
				joinRequest.save(),
				Group.findByIdAndUpdate(group._id, {
					$addToSet: { members: joinRequest.user },
					$pull: { requests: joinRequest.user },
				}),
				User.findByIdAndUpdate(joinRequest.user, {
					$addToSet: { groups: group._id },
				}),
			]);

			const subeventName = group ? group.name : "General Registration";
			let application = await Application.findOne({
				eventId: group.eventId,
				userId: joinRequest.user,
				appliedTo: subeventName,
			});
			if (!application) {
				application = await Application.create({
					eventId: group.eventId,
					userId: joinRequest.user,
					appliedTo: subeventName,
				});
				logger.info("Created application for subevent: " + application);
			}
			await addEmailToQueue(application._id.toString());
		} else if (targetStatus === "rejected") {
			joinRequest.status = "rejected";
			await Promise.all([
				joinRequest.save(),
				Group.findByIdAndUpdate(group._id, {
					$pull: { requests: joinRequest.user, members: joinRequest.user },
				}),
				User.findByIdAndUpdate(joinRequest.user, {
					$pull: { groups: group._id },
				}),
			]);
		} else if (targetStatus === "pending") {
			joinRequest.status = "pending";
			await Promise.all([
				joinRequest.save(),
				Group.findByIdAndUpdate(group._id, {
					$addToSet: { requests: joinRequest.user },
					$pull: { members: joinRequest.user },
				}),
				User.findByIdAndUpdate(joinRequest.user, {
					$pull: { groups: group._id },
				}),
			]);
		}

		res.status(200).json({
			message: `Join request status changed to ${targetStatus}`,
			status: targetStatus,
			requestId: joinRequest._id,
		});
	} catch (err: any) {
		logger.error("Error processing join request:", err);
		res.status(500).json({ message: "Error processing join request", error: err.message });
	}
};

export const joinRequest = async (req: any, res: any) => {
	try {
		const { groupId, groupIds } = req.body;
		const userId = req.user._id;

		// Normalize target group IDs from groupIds array or single groupId
		let targetGroupIds: string[] = [];
		if (Array.isArray(groupIds) && groupIds.length > 0) {
			targetGroupIds = groupIds.map((id: any) => id.toString());
		} else if (groupId) {
			targetGroupIds = [groupId.toString()];
		}

		if (targetGroupIds.length === 0) {
			return res.status(400).json({ message: "Group ID is required" });
		}

		// Single group request (maintains exact backward compatibility)
		if (targetGroupIds.length === 1 && !Array.isArray(groupIds)) {
			const singleGroupId = targetGroupIds[0];
			const group = await Group.findById(singleGroupId).select("members requests admin limit isHead");

			if (!group) {
				return res.status(404).json({ message: "Group not found" });
			}

			// 1. Check if user is already a member
			const isMember = group.members.some(
				(memberId: any) => memberId.toString() === userId.toString()
			);
			if (isMember) {
				return res.status(409).json({
					message: "User is already an approved member of this sub-event",
				});
			}

			// 2. Check if user already has an active or conflicting JoinRequest
			const existingRequest = await JoinRequest.findOne({
				user: userId,
				group: singleGroupId,
			});

			if (existingRequest) {
				if (existingRequest.status === "pending") {
					return res.status(409).json({
						message: "Join request is already pending approval",
					});
				}
				if (existingRequest.status === "approved") {
					return res.status(409).json({
						message: "Join request has already been approved",
					});
				}
				if (existingRequest.status === "rejected") {
					return res.status(409).json({
						message: "Join request for this sub-event was rejected",
					});
				}
				return res.status(409).json({
					message: "A request for this sub-event already exists",
				});
			}

			// 3. Check if user is already in group.requests
			const isAlreadyRequested = group.requests.some(
				(reqId: any) => reqId.toString() === userId.toString()
			);
			if (isAlreadyRequested) {
				return res.status(409).json({
					message: "Join request is already pending approval",
				});
			}

			// 4. Push request and save atomically with unique constraint safety
			try {
				await Promise.all([
					Group.findByIdAndUpdate(singleGroupId, { $addToSet: { requests: userId } }),
					JoinRequest.create({ user: userId, group: singleGroupId, admin: group.admin }),
				]);
			} catch (dbError: any) {
				if (dbError.code === 11000 || dbError.name === "MongoServerError") {
					return res.status(409).json({
						message: "Join request already exists for this sub-event",
					});
				}
				throw dbError;
			}

			const adminId = group.admin.toString(); // Get admin's ID
			const adminSocketId = onlineUsers[adminId]; // Find admin's socket ID

			if (adminSocketId) {
				io.to(adminSocketId).emit("new_request", { groupId: singleGroupId, userId });
			}

			return res.status(200).json({ message: "Request sent successfully" });
		}

		// Multiple group requests (Batch registration)
		const groupQuery = Group.find({ _id: { $in: targetGroupIds } });
		const groups = await (typeof groupQuery?.select === "function" ? groupQuery.select("members requests admin limit isHead name") : groupQuery);
		if (!groups || groups.length === 0) {
			return res.status(404).json({ message: "No sub-events found" });
		}

		const existingRequests = await JoinRequest.find({
			user: userId,
			group: { $in: targetGroupIds },
		}).lean();

		const requestStatusMap = new Map();
		existingRequests.forEach((r: any) => {
			requestStatusMap.set(r.group.toString(), r.status);
		});

		const successfulGroupIds: string[] = [];
		const skipped: { groupId: string; name?: string; reason: string }[] = [];

		for (const group of groups) {
			const gIdStr = group._id.toString();

			// 1. Check if user is already a member
			const isMember = group.members.some(
				(memberId: any) => memberId.toString() === userId.toString()
			);
			if (isMember) {
				skipped.push({ groupId: gIdStr, name: group.name, reason: "Already an approved member" });
				continue;
			}

			// 2. Check existing JoinRequest
			const existingStatus = requestStatusMap.get(gIdStr);
			if (existingStatus === "pending") {
				skipped.push({ groupId: gIdStr, name: group.name, reason: "Already requested (pending approval)" });
				continue;
			}
			if (existingStatus === "approved") {
				skipped.push({ groupId: gIdStr, name: group.name, reason: "Already approved" });
				continue;
			}
			if (existingStatus === "rejected") {
				skipped.push({ groupId: gIdStr, name: group.name, reason: "Join request was rejected" });
				continue;
			}

			// 3. Check group.requests array
			const isAlreadyInRequests = group.requests.some(
				(reqId: any) => reqId.toString() === userId.toString()
			);
			if (isAlreadyInRequests) {
				skipped.push({ groupId: gIdStr, name: group.name, reason: "Already requested" });
				continue;
			}

			// 4. Create join request
			try {
				await Promise.all([
					Group.findByIdAndUpdate(group._id, { $addToSet: { requests: userId } }),
					JoinRequest.create({ user: userId, group: group._id, admin: group.admin }),
				]);
				successfulGroupIds.push(gIdStr);

				const adminId = group.admin?.toString();
				const adminSocketId = onlineUsers[adminId];
				if (adminSocketId) {
					io.to(adminSocketId).emit("new_request", { groupId: gIdStr, userId });
				}
			} catch (dbError: any) {
				if (dbError.code === 11000 || dbError.name === "MongoServerError") {
					skipped.push({ groupId: gIdStr, name: group.name, reason: "Join request already exists" });
				} else {
					logger.error(`Error requesting group ${gIdStr}:`, dbError);
					skipped.push({ groupId: gIdStr, name: group.name, reason: "Database error" });
				}
			}
		}

		if (successfulGroupIds.length === 0) {
			return res.status(409).json({
				message: skipped.length > 0
					? "All selected sub-events were already requested or unavailable"
					: "Could not register for selected sub-events",
				successfulCount: 0,
				skippedCount: skipped.length,
				skipped,
			});
		}

		return res.status(200).json({
			message: `Successfully requested ${successfulGroupIds.length} sub-event${successfulGroupIds.length > 1 ? "s" : ""}`,
			successfulCount: successfulGroupIds.length,
			successfulGroupIds,
			skippedCount: skipped.length,
			skipped,
		});
	} catch (error: any) {
		logger.error("Join Request Error:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
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

		const filteredGroups = groups.filter((group) => !group.isHead);

		if (filteredGroups.length === 0) {
			return res.status(200).json([]);
		}

		let userId: string | null = null;
		if (req.user?._id) {
			userId = req.user._id.toString();
		} else if (req.cookies?.auth) {
			try {
				const decoded = jwt.verify(req.cookies.auth, process.env.JWT_SECRET as string) as any;
				if (decoded?.userId) {
					userId = decoded.userId.toString();
				}
			} catch (err) {
				// unauthenticated or expired token
			}
		}

		let requestMap = new Map<string, string>();
		if (userId) {
			const groupIds = filteredGroups.map((g) => g._id);
			const userRequests = await JoinRequest.find({
				user: userId,
				group: { $in: groupIds },
			}).lean();

			userRequests.forEach((r: any) => {
				requestMap.set(r.group.toString(), r.status);
			});
		}

		const result = filteredGroups.map((group) => {
			const isMember = userId
				? group.members.some((m: any) => m.toString() === userId)
				: false;
			const rawStatus = userId ? requestMap.get(group._id.toString()) || null : null;
			const requestStatus = isMember
				? "approved"
				: rawStatus === "pending"
				? "already requested"
				: rawStatus;

			const isAdmin = userId
				? (group.admin?._id || group.admin)?.toString() === userId
				: false;
			const isModerator = userId
				? Boolean(group.moderators?.some((m: any) => (m?._id || m)?.toString() === userId))
				: false;

			return {
				_id: group._id,
				name: group.name,
				requestStatus, // "already requested" | "approved" | "rejected" | null
				isMember,
				limit: group.limit,
				membersCount: group.members?.length || 0,
				admin: group.admin,
				moderators: group.moderators || [],
				isAdmin,
				isModerator,
			};
		});

		res.status(200).json(result);
	} catch (error: any) {
		logger.error("getGroupByEventId controller error: " + error.message);
		res.status(400).json({ error: error.message });
	}
};

export const getUserRequests = async (req, res) => {
	try {
		const userId = req.user._id;
		const query: any = { user: userId };
		if (req.params.eventId) {
			const groups = await Group.find({ eventId: req.params.eventId }).select("_id");
			query.group = { $in: groups.map((g) => g._id) };
		}
		const requests = await JoinRequest.find(query)
			.populate("group", "name eventId limit")
			.lean();
		res.status(200).json(requests);
	} catch (err: any) {
		logger.error("getUserRequests error:", err);
		res.status(500).json({ message: "Error fetching user requests", error: err.message });
	}
};

export const getUserEventRequestStatus = async (req: any, res: any) => {
	try {
		const userId = req.user?._id;
		const { eventId } = req.params;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized, please login" });
		}

		if (!eventId) {
			return res.status(400).json({ message: "Event ID is required" });
		}

		// Find all non-head sub-event groups for this event
		const groups = await Group.find({ eventId, isHead: false }).select("name members requests limit");
		const groupIds = groups.map((g) => g._id);

		// Find all join requests by this user for these sub-events
		const userRequests = await JoinRequest.find({
			user: userId,
			group: { $in: groupIds },
		}).lean();

		const requestMap = new Map();
		userRequests.forEach((r: any) => {
			requestMap.set(r.group.toString(), r.status);
		});

		const subEvents = groups.map((group) => {
			const isMember = group.members.some(
				(m: any) => m.toString() === userId.toString()
			);
			const isRequestedInGroup = group.requests.some(
				(r: any) => r.toString() === userId.toString()
			);
			const rawStatus = requestMap.get(group._id.toString()) || null;

			let status = "none";
			let statusLabel = "Join";

			if (isMember || rawStatus === "approved") {
				status = "approved";
				statusLabel = "Approved";
			} else if (rawStatus === "pending" || isRequestedInGroup) {
				status = "already requested";
				statusLabel = "Already Requested";
			} else if (rawStatus === "rejected") {
				status = "rejected";
				statusLabel = "Rejected";
			}

			return {
				groupId: group._id,
				groupName: group.name,
				status, // "already requested" | "approved" | "rejected" | "none"
				statusLabel,
				isRequested: status === "already requested",
				isMember,
				rawStatus,
			};
		});

		const statusMap: Record<string, string> = {};
		subEvents.forEach((item) => {
			statusMap[item.groupId.toString()] = item.status;
		});

		return res.status(200).json({
			eventId,
			subEvents,
			statusMap,
		});
	} catch (error: any) {
		logger.error("getUserEventRequestStatus error:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getEventJoinRequests = async (req: any, res: any) => {
	try {
		const { eventId } = req.params;
		if (!eventId) {
			return res.status(400).json({ message: "Event ID is required" });
		}

		const event = await Event.findById(eventId).populate("userId", "userName email profile_image_url");
		if (!event) {
			return res.status(404).json({ message: "Event not found" });
		}

		if (event.paid) {
			return res.status(400).json({
				message: "Join requests are not applicable for paid events",
			});
		}

		// Find all sub-event groups for this event
		const groups = await Group.find({ eventId });
		const groupIds = groups.map((g) => g._id);

		// Authorization check
		if (req.user) {
			const userIdStr = req.user._id?.toString();
			const isEventCreator =
				(event.userId as any)?._id?.toString() === userIdStr ||
				(event.userId as any)?.toString() === userIdStr;
			const isGroupAdminOrMod = groups.some(
				(g) =>
					g.admin?.toString() === userIdStr ||
					g.moderators?.some((m: any) => m?.toString() === userIdStr)
			);
			const isSuperAdmin = req.user.role === "admin";

			if (!isEventCreator && !isGroupAdminOrMod && !isSuperAdmin) {
				return res.status(403).json({
					message: "Access denied. Only event admins or moderators can view join requests.",
				});
			}
		}

		// Fetch all join requests for groups in this event
		const requests = await JoinRequest.find({ group: { $in: groupIds } })
			.populate("user", "userName email profile_image_url phone")
			.populate("group", "name limit members moderators admin isHead eventId")
			.sort({ createdAt: -1 });

		const pendingCount = requests.filter((r) => r.status === "pending").length;
		const approvedCount = requests.filter((r) => r.status === "approved").length;
		const rejectedCount = requests.filter((r) => r.status === "rejected").length;

		const groupsSummary = groups.map((g) => ({
			_id: g._id,
			name: g.name,
			limit: g.limit,
			membersCount: (g.members?.length || 0) - (g.moderators?.length || 0),
		}));

		return res.status(200).json({
			success: true,
			event: {
				_id: event._id,
				title: event.title,
				imageUrl: event.imageUrl,
				eventDate: event.eventDate,
				startTime: event.startTime,
				endTime: event.endTime,
				paid: event.paid,
				amount: event.amount,
				creator: event.userId,
			},
			counts: {
				total: requests.length,
				pending: pendingCount,
				approved: approvedCount,
				rejected: rejectedCount,
			},
			groups: groupsSummary,
			requests,
		});
	} catch (error: any) {
		logger.error("getEventJoinRequests error:", error);
		return res.status(500).json({
			message: "Failed to fetch event join requests",
			error: error.message,
		});
	}
};
