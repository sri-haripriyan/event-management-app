import Application from "../models/applicationModel.js";
import Event from "../models/eventModel.js";
import { computeTicketStatus } from "../utils/eventTiming.js";
import logger from "../utils/logger.js";

/**
 * Scan ticket and mark attendance directly in MongoDB.
 * Uses atomic findOneAndUpdate to prevent duplicate or concurrent check-ins.
 */
export const scanTicketCheckIn = async (req: any, res: any) => {
	try {
		const { qrPayload, applicationId, eventId } = req.body;
		const paramEventId = req.params?.eventId;
		let appId = applicationId;
		let evId = eventId || paramEventId;

		if (qrPayload && typeof qrPayload === "string") {
			if (qrPayload.includes("==")) {
				const parts = qrPayload.split("==");
				evId = evId || parts[0]?.trim();
				appId = appId || parts[1]?.trim();
			} else {
				appId = appId || qrPayload.trim();
			}
		}

		if (!appId) {
			return res.status(400).json({
				message: "Invalid ticket QR code format",
				error: "Malformed QR code payload",
				isInvalidQR: true,
			});
		}

		// Look up application and event
		const existingApp = await Application.findById(appId)
			.populate("eventId")
			.populate("userId", "userName email profile_image_url");

		if (!existingApp) {
			return res.status(404).json({
				message: "Ticket / registration not found in system",
				error: "Invalid ticket QR code: registration not found",
				isInvalidQR: true,
			});
		}

		const event = existingApp.eventId as any;
		if (evId && event?._id && event._id.toString() !== evId.toString()) {
			return res.status(400).json({
				message: "Ticket does not belong to this event",
				error: "Event mismatch: QR code is for a different event",
				isInvalidQR: true,
			});
		}

		// Authorization: either event creator, host, or the attendee themselves (simulation)
		const currentUserId = req.user?._id?.toString();
		const eventOwnerId = event?.userId?._id?.toString() || event?.userId?.toString();
		const ticketOwnerId = (existingApp.userId as any)?._id?.toString() || existingApp.userId?.toString();

		const isAuthorized =
			req.user?.isHost ||
			currentUserId === eventOwnerId ||
			currentUserId === ticketOwnerId;

		if (!isAuthorized) {
			return res.status(403).json({
				message: "Access denied: You are not authorized to mark attendance for this event",
				error: "Unauthorized operator",
			});
		}

		// Check if already checked in
		if (existingApp.checkIn?.status === "SCANNED" || existingApp.isAttended) {
			return res.status(409).json({
				message: "Ticket has already been scanned and checked in",
				error: "Ticket has already been scanned and checked in",
				alreadyScanned: true,
				checkIn: existingApp.checkIn,
				scannedAt: existingApp.checkIn?.scannedAt,
				data: {
					_id: existingApp._id,
					registrationId: existingApp._id,
					userName: (existingApp.userId as any)?.userName || "Attendee",
					email: (existingApp.userId as any)?.email,
					profile_image_url: (existingApp.userId as any)?.profile_image_url,
					appliedTo: existingApp.appliedTo || "General Entry",
					isAttended: true,
					checkIn: existingApp.checkIn,
					scannedAt: existingApp.checkIn?.scannedAt,
				},
				ticket: {
					applicationId: existingApp._id,
					checkIn: existingApp.checkIn,
					isAttended: true,
					event: {
						_id: event?._id,
						title: event?.title,
						eventDate: event?.eventDate,
						startTime: event?.startTime,
						endTime: event?.endTime,
					},
					user: existingApp.userId,
				},
			});
		}

		const scannedAt = new Date();

		// Atomic database update to prevent race conditions
		const updatedApplication = await Application.findOneAndUpdate(
			{
				_id: appId,
				"checkIn.status": { $ne: "SCANNED" },
				isAttended: { $ne: true },
			},
			{
				$set: {
					"checkIn.status": "SCANNED",
					"checkIn.scannedAt": scannedAt,
					isAttended: true,
				},
			},
			{ new: true }
		)
			.populate("eventId")
			.populate("userId", "userName email profile_image_url");

		if (!updatedApplication) {
			// Concurrently updated by another request
			const currentApp = await Application.findById(appId)
				.populate("eventId")
				.populate("userId", "userName email profile_image_url") || existingApp;

			return res.status(409).json({
				message: "Ticket has already been scanned and checked in",
				error: "Ticket has already been scanned and checked in",
				alreadyScanned: true,
				checkIn: currentApp.checkIn,
				scannedAt: currentApp.checkIn?.scannedAt || scannedAt,
				data: {
					_id: currentApp._id,
					registrationId: currentApp._id,
					userName: (currentApp.userId as any)?.userName || "Attendee",
					email: (currentApp.userId as any)?.email,
					profile_image_url: (currentApp.userId as any)?.profile_image_url,
					appliedTo: currentApp.appliedTo || "General Entry",
					isAttended: true,
					checkIn: currentApp.checkIn,
					scannedAt: currentApp.checkIn?.scannedAt || scannedAt,
				},
				ticket: {
					applicationId: currentApp._id,
					checkIn: currentApp.checkIn,
					isAttended: true,
					event: {
						_id: event?._id,
						title: event?.title,
						eventDate: event?.eventDate,
						startTime: event?.startTime,
						endTime: event?.endTime,
					},
					user: currentApp.userId,
				},
			});
		}

		const timing = computeTicketStatus(event?.eventDate, event?.endTime, updatedApplication.checkIn);

		return res.status(200).json({
			message: "Attendance marked successfully",
			success: true,
			data: {
				_id: updatedApplication._id,
				registrationId: updatedApplication._id,
				userName: (updatedApplication.userId as any)?.userName || "Attendee",
				email: (updatedApplication.userId as any)?.email,
				profile_image_url: (updatedApplication.userId as any)?.profile_image_url,
				appliedTo: updatedApplication.appliedTo || "General Entry",
				isAttended: true,
				checkIn: updatedApplication.checkIn,
				scannedAt: updatedApplication.checkIn?.scannedAt || scannedAt,
			},
			ticket: {
				applicationId: updatedApplication._id,
				checkIn: updatedApplication.checkIn,
				isAttended: true,
				expiryStatus: timing.expiryStatus,
				event: {
					_id: event?._id,
					title: event?.title,
					eventDate: event?.eventDate,
					startTime: event?.startTime,
					endTime: event?.endTime,
				},
				user: updatedApplication.userId,
			},
		});
	} catch (err: any) {
		logger.error("Scan ticket check-in error: " + err.message);
		return res.status(500).json({ message: "Server error", error: err.message });
	}
};

/**
 * Fetch attendee registrations for an event (Attendance Roster).
 * Only accessible by event organizers / hosts.
 * Queries directly from MongoDB with no Redis dependency.
 */
export const getEventAttendance = async (req: any, res: any) => {
	try {
		const { eventId } = req.params;
		if (!eventId) {
			return res.status(400).json({ message: "Event ID is required" });
		}

		const event = await Event.findById(eventId).populate("userId", "userName email");
		if (!event) {
			return res.status(404).json({ message: "Event not found" });
		}

		// Verify authorization: current user must be creator or host
		const currentUserId = req.user?._id?.toString();
		const eventOwnerId = (event.userId as any)?._id?.toString() || event.userId?.toString();

		const isAuthorized = req.user?.isHost || currentUserId === eventOwnerId;
		if (!isAuthorized) {
			return res.status(403).json({
				message: "Access denied: Only event organizers can view attendance records",
			});
		}

		const applications = await Application.find({ eventId })
			.populate("userId", "userName email profile_image_url")
			.sort({ createdAt: 1 })
			.lean();

		const attendances = applications.map((app: any) => {
			const isAttended = app.isAttended === true || app.checkIn?.status === "SCANNED";
			return {
				_id: app._id,
				userName: app.userId?.userName || "Attendee",
				email: app.userId?.email || "N/A",
				profile_image_url: app.userId?.profile_image_url || "",
				appliedTo: app.appliedTo || "General Entry",
				isAttended,
				checkIn: app.checkIn || {
					status: isAttended ? "SCANNED" : "NOT_SCANNED",
					scannedAt: isAttended ? app.updatedAt : null,
				},
				createdAt: app.createdAt,
			};
		});

		const present = attendances.filter((a) => a.isAttended).length;
		const total = attendances.length;
		const absent = total - present;

		return res.status(200).json({
			success: true,
			message: "Fetched attendance data successfully",
			event: {
				_id: event._id,
				title: event.title,
				eventDate: event.eventDate,
				startTime: event.startTime,
				endTime: event.endTime,
				imageUrl: event.imageUrl,
			},
			attendances,
			stats: {
				total,
				present,
				absent,
			},
		});
	} catch (error: any) {
		logger.error("Get event attendance error: " + error.message);
		return res.status(500).json({
			message: "Failed to fetch attendance data",
			error: error.message,
			success: false,
		});
	}
};