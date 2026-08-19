import PQueue from "p-queue";
import { sendEmailWithQRCode } from "../utils/mail.js";

const queue = new PQueue({ concurrency: 5 });

export const addEmailToQueue = async (attendanceId) => {
	queue.add(() => sendEmailWithQRCode(attendanceId));
	console.log(`Email job added to queue for: ${attendanceId}`);
};
