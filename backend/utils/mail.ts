import nodemailer from "nodemailer";
import Application from "../models/applicationModel.js";
import { ensureApplicationQRCode } from "./ticketQR.js";
import logger from "./logger.js";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
	logger: true,
	debug: true,
});

// Verify email transporter on startup
transporter.verify((error, success) => {
	if (error) {
		logger.error(`Email transporter verification failed: ${error.message}`);
		console.error("Email transporter verification failed:", error.message);
	} else {
		logger.info("Email service transporter is ready to send messages");
		console.log("Email service transporter is ready to send messages");
	}
});

export const sendEmailWithQRCode = async (applicationId: string) => {
	try {
		const application = await Application.findById(applicationId)
			.populate("userId", "userName email")
			.populate("eventId", "title") as any;

		if (!application) {
			logger.error(`sendEmailWithQRCode: Application document not found for ID: ${applicationId}`);
			console.error(`sendEmailWithQRCode: Application not found: ${applicationId}`);
			return;
		}

		// Use the same persisted QR code stored in Appwrite
		const { qrBuffer, qrCodeUrl } = await ensureApplicationQRCode(application);

		let attachmentBuffer: Buffer | null = null;
		if (Buffer.isBuffer(qrBuffer)) {
			attachmentBuffer = qrBuffer;
		} else if (typeof qrCodeUrl === "string" && qrCodeUrl.includes(";base64,")) {
			attachmentBuffer = Buffer.from(qrCodeUrl.split(";base64,").pop()!, "base64");
		}

		const subeventName =
			typeof application.appliedTo === "string"
				? application.appliedTo
				: Array.isArray(application.appliedTo)
					? application.appliedTo[0]
					: "General Entry";

		const recipientEmail = process.env.TEST_EMAIL || application.userId?.email;

		const mailOptions: any = {
			from: process.env.EMAIL_USER,
			to: recipientEmail,
			subject: `Application successful for ${subeventName}`,
			html: `
					<h2>${application.eventId?.title || "Event Registration"}</h2>
					<p>Scan this QR code for sub-event attendance:</p>
					<img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px;"/> 
					<h3>Registered Sub-event</h3>
					<p style="font-size: 16px; font-weight: bold; color: #4F46E5;">${subeventName}</p>
					<p>Thank you for registering for <b>${subeventName}</b>!</p>
				`,
			attachments: attachmentBuffer
				? [
					{
						filename: "qrcode.png",
						content: attachmentBuffer,
						cid: "qrcode",
					},
				]
				: [],
		};

		const info = await transporter.sendMail(mailOptions);
		logger.info(`Email successfully sent to ${recipientEmail}: ${info?.messageId || "OK"}`);
		console.log(`Email successfully sent to ${recipientEmail}`);
	} catch (error: any) {
		logger.error(`Failed to send email for application ${applicationId}: ${error?.message || error}`);
		console.error(`Failed to send email:`, error);
	}
};
