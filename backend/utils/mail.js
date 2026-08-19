import nodemailer from "nodemailer";
import Application from "../models/applicationModel.js";
import { generateQRCode } from "./generateQR.js";
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
			.populate("eventId", "title");
		const qrCodeBase64 = await generateQRCode(
			`${application.eventId._id.toString()}==${application._id}`
		);
		const eventList = application.appliedTo
			.map((event, index) => `<li><b>${index + 1}. ${event}</b></li>`)
			.join("");

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: application.userId.email,
			subject: `Application successful for ${application.eventId.title}`,
			html: `
					<h2>${application.eventId.title}</h2>
					<p>Scan this QR code for event attendance:</p>
					<img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px;"/> 
					<h3>Registered Events</h3>
					<ul>${eventList}</ul>
					<p>Thank you for registering!</p>
				`,
			attachments: [
				{
					filename: "qrcode.png",
					content: qrCodeBase64.split(";base64,").pop(),
					encoding: "base64",
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
