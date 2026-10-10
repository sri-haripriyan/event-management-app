import PQueue from "p-queue";
import { sendEmailWithQRCode } from "../utils/mail.js";

const queue = new PQueue({ concurrency: 5 });

export const addEmailToQueue = async (applicationId: string) => {
	const job = () => sendEmailWithQRCode(applicationId);
	queue.add(job);
	console.log(`Email job added to queue for: ${applicationId}`);
};