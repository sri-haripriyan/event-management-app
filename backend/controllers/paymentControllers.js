import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Payment from "../models/paymentModel.js";
import Group from "../models/groupModel.js";
import logger from "../utils/logger.js";
import Application from "../models/applicationModel.js";
import { addEmailToQueue } from "../queues/emailQueue.js";
dotenv.config();

const razorpayInstance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
	try {
		const options = {
			amount: req.body.amount,
			currency: "INR",
			receipt: "receipt#1",
			payment_capture: 1,
		};
		const group = await Group.findById(req.body.groupId);
		logger.info(group.toString());
		console.log("Groups members: " + group.members.length + " limit: " + group.limit);
		if ((group.members.length - group.moderators.length) + 1 > group.limit) {
			return res
				.status(400)
				.json({ message: "Participants limit reached!", error: "Participants limit reached!" });
		}
		const order = await razorpayInstance.orders.create(options);
		res.status(200).json(order);
	} catch (error) {
		logger.error("order creating", error);
		res.status(500).json({ error: error.message });
	}
};
export const capturePayment = async (req, res) => {
	try {
		const { payment_id, amount } = req.body;

		const response = await razorpayInstance.payments.capture(payment_id, amount);
		res.status(200).json(response);
	} catch (error) {
		logger.error("capture payment", error);
		res.status(500).json({ error: error.message });
	}
};
export const verifyPayment = async (req, res) => {
	const { razorpay_order_id, razorpay_payment_id, razorpay_signature, groupId, eventId } =
		req.body;
	try {
		const userId = req.user._id;
		const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
		hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
		const generated_signature = hmac.digest("hex");

		if (generated_signature === razorpay_signature) {
			const payment = new Payment({
				groupId,
				userId,
				eventId,
				razorpayOrderId: razorpay_order_id,
				razorpayPaymentId: razorpay_payment_id,
				razorpaySignature: razorpay_signature,
			});

			const group = await Group.findById(groupId);
			let application = await Application.findOne({ eventId, userId });
			if (application) {
				application.appliedTo.push(group.name);
				const updatedApplication = await application.save();
				logger.info("Updated application: " + updatedApplication);
			} else {
				application = await Application.create({
					eventId,
					userId,
					appliedTo: [group.name],
				});
				logger.info("Updated application: " + application);
			}
			await addEmailToQueue(application._id);

			await payment.save();
			res.status(200).json({ message: "Payment verified successfully" });
		}
	} catch (error) {
		logger.error("verify payment", error);
		res.status(400).json({ message: "Payment verification failed", error });
	}
};

export const verifyEventApplied = async (req, res) => {
	const { eventId } = req.params;
	try {
		const events = await Payment.find({
			eventId: eventId,
			userId: req.user._id,
		})
			.select("groupId")
			.populate("groupId", "name")
			.lean();

		const groupIds = events.map((event) => event.groupId);
		res.status(200).json({ groupIds });
	} catch (error) {
		logger.error(error);
	}
};
