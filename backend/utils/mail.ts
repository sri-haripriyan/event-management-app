import nodemailer from "nodemailer";
import Application from "../models/applicationModel.js";
import { ensureApplicationQRCode } from "./ticketQR.js";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
	logger: true,
	debug: true,
});

export const sendEmailWithQRCode = async (applicationId) => {
	try {
		const application = await Application.findById(applicationId)
			.populate("userId", "userName email")
			.populate("eventId", "title") as any;

		// Use the same persisted QR code stored in Appwrite
		const { qrBuffer, qrCodeUrl } = await ensureApplicationQRCode(application);
		const attachmentContent = qrBuffer || qrCodeUrl.split(";base64,").pop();
		const subeventName =
			typeof application.appliedTo === "string"
				? application.appliedTo
				: Array.isArray(application.appliedTo)
				? application.appliedTo[0]
				: "General Entry";

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: application.userId.email,
			subject: `Application successful for ${subeventName}`,
			html: `
					<h2>${application.eventId?.title || "Event Registration"}</h2>
					<p>Scan this QR code for sub-event attendance:</p>
					<img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px;"/> 
					<h3>Registered Sub-event</h3>
					<p style="font-size: 16px; font-weight: bold; color: #4F46E5;">${subeventName}</p>
					<p>Thank you for registering for <b>${subeventName}</b>!</p>
				`,
			attachments: [
				{
					filename: "qrcode.png",
					content: attachmentContent,
					encoding: Buffer.isBuffer(attachmentContent) ? undefined : "base64",
					cid: "qrcode",
				},
			],
		};
		await transporter.sendMail(mailOptions);
		console.log(`Email sent to ${application.userId.email}`);
	} catch (error) {
		console.error(`Failed to send email:`, error);
	}
};
