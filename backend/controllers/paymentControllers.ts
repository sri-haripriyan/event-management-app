import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
import Group from "../models/groupModel.js";
import Event from "../models/eventModel.js";
import logger from "../utils/logger.js";
import Application from "../models/applicationModel.js";
import { addEmailToQueue } from "../queues/emailQueue.js";
import { createNotification } from "../utils/notification.js";
dotenv.config();

const razorpayInstance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID || "rzp_placeholder_key",
	key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_placeholder_secret",
}) as any;

/**
 * Calculate payment summary for selected sub-events.
 * Computes price from the event model, verifies participant limits,
 * and identifies already-paid sub-events for the current user.
 */
export const getPaymentSummary = async (req: any, res: any) => {
	try {
		const eventId = req.params?.eventId || req.body?.eventId || req.query?.eventId;
		let groupIds: string[] = [];

		if (Array.isArray(req.body?.groupIds)) {
			groupIds = req.body.groupIds;
		} else if (typeof req.query?.groupIds === "string") {
			groupIds = req.query.groupIds
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
		} else if (req.body?.groupId) {
			groupIds = [req.body.groupId];
		} else if (req.query?.groupId) {
			groupIds = [String(req.query.groupId)];
		}

		if (!eventId) {
			return res.status(400).json({ message: "eventId is required", error: "Missing eventId" });
		}

		const event = await Event.findById(eventId);
		if (!event) {
			return res.status(404).json({ message: "Event not found", error: "Event not found" });
		}

		// Find groups matching the IDs and event (or all groups of event if none selected)
		const query: any = { eventId };
		if (groupIds.length > 0) {
			query._id = { $in: groupIds };
		}
		const groups = await Group.find(query);

		// Check already paid sub-events for this user in this event
		const userId = req.user?._id;
		const userPayments = userId
			? await Payment.find({ eventId, userId }).select("groupId groupIds").lean()
			: [];
		const paidGroupIds = userPayments
			.flatMap((p: any) => [
				p.groupId?.toString(),
				...(Array.isArray(p.groupIds) ? p.groupIds.map((g: any) => g?.toString()) : []),
			])
			.filter(Boolean);

		const unitPrice = Number(event.amount) || 0;
		const isPaidEvent = Boolean(event.paid);

		const selectedItems = groups.map((grp: any) => {
			const adminId = (grp.admin?._id || grp.admin)?.toString();
			const modIdSet = new Set(
				(grp.moderators || []).map((m: any) => (m?._id || m)?.toString())
			);
			const attendeeMembers = (grp.members || []).filter((m: any) => {
				const mId = (m?._id || m)?.toString();
				return mId && mId !== adminId && !modIdSet.has(mId);
			});
			const memberCount = attendeeMembers.length;
			const isLimitReached = grp.limit ? memberCount >= grp.limit : false;
			const isAlreadyPaid = paidGroupIds.includes(grp._id.toString());
			const isMember = userId && attendeeMembers.some((m: any) => (m?._id || m)?.toString() === userId.toString());

			return {
				_id: grp._id,
				name: grp.name,
				description: grp.description,
				limit: grp.limit,
				membersCount: memberCount,
				isLimitReached,
				isAlreadyPaid,
				isMember: Boolean(isMember),
				amount: unitPrice,
			};
		});

		// Count of chargeable sub-events (excluding already paid ones)
		const chargeableItems = selectedItems.filter((item) => !item.isAlreadyPaid);
		const totalAmount = isPaidEvent ? unitPrice * chargeableItems.length : 0;
		const totalAmountInPaise = totalAmount * 100;

		return res.status(200).json({
			success: true,
			eventId: event._id,
			eventTitle: event.title,
			eventImageUrl: event.imageUrl,
			eventDate: event.eventDate,
			startTime: event.startTime,
			endTime: event.endTime,
			isPaidEvent,
			unitPrice,
			currency: "INR",
			totalSelected: selectedItems.length,
			chargeableCount: chargeableItems.length,
			totalAmount,
			totalAmountInPaise,
			items: selectedItems,
			paidGroupIds,
		});
	} catch (error: any) {
		logger.error("getPaymentSummary error", error);
		return res.status(500).json({
			message: "Failed to calculate payment summary",
			error: error.message,
		});
	}
};

export const createOrder = async (req: any, res: any) => {
	try {
		let groupIds: string[] = [];
		if (Array.isArray(req.body?.groupIds) && req.body.groupIds.length > 0) {
			groupIds = req.body.groupIds;
		} else if (req.body?.groupId) {
			groupIds = [req.body.groupId];
		}

		if (groupIds.length === 0) {
			return res.status(400).json({ message: "No sub-events selected", error: "Missing groupIds" });
		}

		// Find groups
		const groups = await Group.find({ _id: { $in: groupIds } });
		if (groups.length === 0) {
			return res.status(404).json({ message: "Selected sub-events not found", error: "Not found" });
		}

		// Check participant limits for each group (excluding admin and moderators)
		for (const group of groups) {
			const adminId = (group.admin?._id || group.admin)?.toString();
			const modIdSet = new Set(
				(group.moderators || []).map((m: any) => (m?._id || m)?.toString())
			);
			const attendeeMembers = (group.members || []).filter((m: any) => {
				const mId = (m?._id || m)?.toString();
				return mId && mId !== adminId && !modIdSet.has(mId);
			});
			const memberCount = attendeeMembers.length;
			if (group.limit && memberCount + 1 > group.limit) {
				return res.status(400).json({
					message: `Participant limit reached for "${group.name}"!`,
					error: "Participants limit reached!",
				});
			}
		}

		// Calculate server-verified amount from the event
		const eventId = req.body?.eventId || groups[0]?.eventId;
		const event = await Event.findById(eventId);
		const unitPrice = event?.paid ? (Number(event?.amount) || 0) : 0;
		const totalAmount = unitPrice * groups.length;
		const amountInPaise = totalAmount > 0 ? totalAmount * 100 : (req.body?.amount || 0);

		if (amountInPaise <= 0) {
			return res.status(400).json({ message: "Invalid order amount", error: "Invalid amount" });
		}

		const options = {
			amount: amountInPaise,
			currency: "INR",
			receipt: `rcpt_${Date.now()}`,
			payment_capture: 1,
			notes: {
				eventId: eventId?.toString() || "",
				groupIds: groupIds.join(","),
				userId: req.user?._id?.toString() || "",
			},
		};

		const order = await razorpayInstance.orders.create(options);
		res.status(200).json(order);
	} catch (error: any) {
		logger.error("order creating", error);
		res.status(500).json({ error: error.message });
	}
};

export const capturePayment = async (req: any, res: any) => {
	try {
		const { payment_id, amount } = req.body;

		const response = await razorpayInstance.payments.capture(payment_id, amount);
		res.status(200).json(response);
	} catch (error: any) {
		logger.error("capture payment", error);
		res.status(500).json({ error: error.message });
	}
};

export const verifyPayment = async (req: any, res: any) => {
	const {
		razorpay_order_id,
		razorpay_payment_id,
		razorpay_signature,
		groupId,
		groupIds,
		eventId,
	} = req.body;

	try {
		let targetGroupIds: string[] = [];
		if (Array.isArray(groupIds) && groupIds.length > 0) {
			targetGroupIds = groupIds;
		} else if (groupId) {
			targetGroupIds = [groupId];
		}

		const userId = req.user._id;
		const secret = (process.env.RAZORPAY_KEY_SECRET || "rzp_placeholder_secret") as string;
		const hmac = crypto.createHmac("sha256", secret);
		hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
		const generated_signature = hmac.digest("hex");

		// Timing-safe comparison to prevent timing side-channel attacks
		const generatedBuffer = Buffer.from(generated_signature);
		const signatureBuffer = Buffer.from(
			typeof razorpay_signature === "string" ? razorpay_signature : ""
		);
		const isSignatureValid =
			generatedBuffer.length === signatureBuffer.length &&
			crypto.timingSafeEqual(generatedBuffer, signatureBuffer);

		if (!isSignatureValid) {
			return res.status(400).json({ message: "Payment signature verification failed" });
		}

		// Idempotency check: if Payment with this razorpayPaymentId already exists, return existing result
		const existingPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
		if (existingPayment) {
			return res.status(200).json({
				message: "Payment verified successfully",
				count: targetGroupIds.length,
			});
		}

		if (isSignatureValid) {
			// Find event to determine server-side price
			let orderAmount = 0;
			if (eventId && mongoose.connection.readyState !== 0) {
				try {
					const ev = await Event.findById(eventId).select("amount paid").lean();
					if (ev && (ev as any).paid) {
						orderAmount = (Number((ev as any).amount) || 0) * targetGroupIds.length;
					}
				} catch (_) {}
			}

			// Create payment record once (idempotent & unique per razorpayPaymentId)
			let savedPayment: any = await Payment.findOne({
				razorpayPaymentId: razorpay_payment_id,
			});

			if (!savedPayment && targetGroupIds.length > 0) {
				const primaryGroupId = targetGroupIds[0];
				const payment = new Payment({
					groupId: primaryGroupId,
					groupIds: targetGroupIds,
					userId,
					eventId,
					razorpayOrderId: razorpay_order_id,
					razorpayPaymentId: razorpay_payment_id,
					razorpaySignature: razorpay_signature,
					status: "paid",
					amount: orderAmount,
					currency: "INR",
				});
				savedPayment = await payment.save();
			}

			for (const gid of targetGroupIds) {
				const group = await Group.findById(gid);
				if (group) {
					if (!group.members.some((m: any) => m?.toString() === userId.toString())) {
						group.members.push(userId);
						await group.save();
					}
					const subeventName = group.name || "General Registration";
					let application = await Application.findOne({
						eventId,
						userId,
						appliedTo: subeventName,
					});
					if (!application) {
						application = await Application.create({
							eventId,
							userId,
							appliedTo: subeventName,
							paymentId: savedPayment?._id,
						});
						logger.info("Created application for subevent: " + application);
					} else if (!application.paymentId && savedPayment?._id) {
						application.paymentId = savedPayment._id;
						await application.save();
					}

					if (savedPayment && !savedPayment.applicationId) {
						savedPayment.applicationId = application._id;
						await savedPayment.save();
					}

					await addEmailToQueue(application._id.toString());

					// Create registration notification
					let eventTitle = "Event";
					if (eventId && (mongoose.connection.readyState !== 0 || (Event.findById as any) !== (mongoose.Model as any).findById)) {
						try {
							const targetEvent = await Event.findById(eventId).select("title").lean();
							if ((targetEvent as any)?.title) eventTitle = (targetEvent as any).title;
						} catch (_) {}
					}
					await createNotification({
						userId,
						eventId,
						title: "Registered for this subevent in the event",
						message: `Registered for this subevent in the event: Registered for ${subeventName} in the event "${eventTitle}".`,
						type: "event_registration",
						subEventName: subeventName,
					});
				}
			}

			res.status(200).json({
				message: "Payment verified successfully",
				count: targetGroupIds.length,
			});
		} else {
			res.status(400).json({ message: "Payment signature verification failed" });
		}
	} catch (error: any) {
		logger.error("verify payment", error);
		res.status(400).json({ message: "Payment verification failed", error: error.message });
	}
};

export const verifyEventApplied = async (req: any, res: any) => {
	const { eventId } = req.params;
	try {
		const events = await Payment.find({
			eventId: eventId,
			userId: req.user._id,
		})
			.select("groupId groupIds")
			.populate("groupId", "name")
			.populate("groupIds", "name")
			.lean();

		const groupIds = events
			.flatMap((event: any) => [
				event.groupId,
				...(Array.isArray(event.groupIds) ? event.groupIds : []),
			])
			.filter(Boolean);
		res.status(200).json({ groupIds });
	} catch (error: any) {
		logger.error("verifyEventApplied error", error);
		res.status(500).json({ error: error.message });
	}
};

/**
 * Fetch complete payment history for an event.
 * Accessible by event hosts (creators), platform admins, and event track moderators.
 * Returns attendee username, email, phone number, subevent registered to, amount, and transactionId.
 */
export const getEventPaymentHistory = async (req: any, res: any) => {
	try {
		const eventId = req.params?.eventId || req.query?.eventId;
		if (!eventId) {
			return res.status(400).json({ message: "eventId is required", error: "Missing eventId" });
		}

		const event = await Event.findById(eventId);
		if (!event) {
			return res.status(404).json({ message: "Event not found", error: "Event not found" });
		}

		const userId = req.user?._id?.toString();
		const eventCreatorId = (event.userId?._id || event.userId)?.toString();
		const isCreator = Boolean(eventCreatorId && eventCreatorId === userId);
		const isSuperAdmin = req.user?.role === "admin";

		let isAuthorized = isCreator || isSuperAdmin;
		if (!isAuthorized) {
			const groups = await Group.find({ eventId });
			const isGroupAdminOrMod = (groups || []).some((g: any) => {
				const adminId = (g?.admin?._id || g?.admin)?.toString();
				const mods = (g?.moderators || []).map((m: any) => (m?._id || m)?.toString());
				return (adminId && adminId === userId) || mods.includes(userId);
			});
			isAuthorized = isGroupAdminOrMod;
		}

		if (!isAuthorized) {
			return res.status(403).json({
				message: "Access denied. Only event hosts and moderators can view payment history.",
				error: "Forbidden",
			});
		}

		let query: any = Payment.find({ eventId });
		if (typeof query?.populate === "function") {
			query = query
				.populate("userId", "userName email phone profile_image_url")
				.populate("groupId", "name")
				.populate("groupIds", "name")
				.sort({ createdAt: -1 });
		}
		if (typeof query?.lean === "function") {
			query = query.lean();
		}
		const payments = await query;
		const list = Array.isArray(payments) ? payments : [];

		const formattedPayments = list.map((p: any) => {
			let subEvents: string[] = [];
			if (Array.isArray(p.groupIds) && p.groupIds.length > 0) {
				subEvents = p.groupIds
					.map((g: any) => (typeof g === "object" ? g?.name : g))
					.filter(Boolean);
			} else if (p.groupId) {
				const gName = typeof p.groupId === "object" ? p.groupId?.name : p.groupId;
				if (gName) subEvents = [gName];
			}
			const subevent = subEvents.length > 0 ? subEvents.join(", ") : "General Registration";

			const amount =
				p.amount !== undefined && p.amount !== null
					? Number(p.amount)
					: Number(event.amount) || 0;

			return {
				_id: p._id,
				username: p.userId?.userName || "Unknown User",
				email: p.userId?.email || "N/A",
				phone: p.userId?.phone || "N/A",
				userProfileImage: p.userId?.profile_image_url || null,
				userId: p.userId?._id || p.userId || null,
				subevent,
				subEvents,
				amount,
				currency: p.currency || "INR",
				transactionId: p.razorpayPaymentId || "N/A",
				orderId: p.razorpayOrderId || "N/A",
				status: p.status || "paid",
				createdAt: p.createdAt || new Date(),
			};
		});

		const totalRevenue = formattedPayments.reduce(
			(acc, curr) => acc + (Number(curr.amount) || 0),
			0
		);

		return res.status(200).json({
			success: true,
			count: formattedPayments.length,
			totalRevenue,
			eventTitle: event.title,
			currency: "INR",
			payments: formattedPayments,
		});
	} catch (error: any) {
		logger.error("getEventPaymentHistory error", error);
		return res.status(500).json({
			message: "Failed to fetch payment history",
			error: error.message,
		});
	}
};
