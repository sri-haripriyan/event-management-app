import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Payment from "../models/paymentModel.js";
import Group from "../models/groupModel.js";
import Event from "../models/eventModel.js";
import logger from "../utils/logger.js";
import Application from "../models/applicationModel.js";
import { addEmailToQueue } from "../queues/emailQueue.js";
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
			? await Payment.find({ eventId, userId }).select("groupId").lean()
			: [];
		const paidGroupIds = userPayments.map((p: any) => p.groupId?.toString());

		const unitPrice = Number(event.amount) || 0;
		const isPaidEvent = Boolean(event.paid);

		const selectedItems = groups.map((grp: any) => {
			const memberCount = (grp.members?.length || 0) - (grp.moderators?.length || 0);
			const isLimitReached = grp.limit ? memberCount >= grp.limit : false;
			const isAlreadyPaid = paidGroupIds.includes(grp._id.toString());
			const isMember = userId && grp.members?.some((m: any) => m?.toString() === userId.toString());

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

		// Check participant limits for each group
		for (const group of groups) {
			const memberCount = (group.members?.length || 0) - (group.moderators?.length || 0);
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
		const userId = req.user._id;
		const secret = (process.env.RAZORPAY_KEY_SECRET || "rzp_placeholder_secret") as string;
		const hmac = crypto.createHmac("sha256", secret);
		hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
		const generated_signature = hmac.digest("hex");

		if (generated_signature === razorpay_signature) {
			let targetGroupIds: string[] = [];
			if (Array.isArray(groupIds) && groupIds.length > 0) {
				targetGroupIds = groupIds;
			} else if (groupId) {
				targetGroupIds = [groupId];
			}

			for (const gid of targetGroupIds) {
				const existingPayment = await Payment.findOne({
					groupId: gid,
					userId,
					eventId,
					razorpayOrderId: razorpay_order_id,
				});

				if (!existingPayment) {
					const payment = new Payment({
						groupId: gid,
						userId,
						eventId,
						razorpayOrderId: razorpay_order_id,
						razorpayPaymentId: razorpay_payment_id,
						razorpaySignature: razorpay_signature,
					});
					await payment.save();
				}

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
						});
						logger.info("Created application for subevent: " + application);
					}
					await addEmailToQueue(application._id.toString());
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
			.select("groupId")
			.populate("groupId", "name")
			.lean();

		const groupIds = events.map((event: any) => event.groupId);
		res.status(200).json({ groupIds });
	} catch (error: any) {
		logger.error("verifyEventApplied error", error);
		res.status(500).json({ error: error.message });
	}
};
