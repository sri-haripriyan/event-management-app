import Queue from "p-queue";
import Application from "../models/applicationModel.js";
const queue = new Queue({ concurrency: 5 });

export const addAttendanceToQueue = async (applicationId) => {
	queue.add(() => updateAttendance(applicationId));
};

const updateAttendance = async (applicationId) => {
	const res = await Application.findByIdAndUpdate(
		applicationId,
		{ isAttended: true },
		{ new: true }
	);
	console.log(`attendance updated for ${res}`);
};
