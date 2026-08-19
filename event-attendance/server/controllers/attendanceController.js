import Application from "../models/applicationModel.js";
import mongoose from "mongoose";
import { redisClient } from "../redis/redis.js";
import { addAttendanceToQueue } from "../queues/attendanceQueue.js";
export const getAttendance = async (req, res) => {
	try {
		const { eventId } = req.params;
		console.log(eventId);
		const attendances = await Application.aggregate([
			{
				$match: {
					eventId: new mongoose.Types.ObjectId(eventId),
				},
			},
			{
				$lookup: {
					from: "events",
					let: { eventId: "$eventId" }, // Use let to access the field
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$_id", "$$eventId"] }, // Compare using $expr
							},
						},
						{ $project: { _id: 1 /* other event fields you need */ } }, // Project only needed event fields
					],
					as: "event",
				},
			},
			{
				$lookup: {
					from: "users",
					let: { userId: "$userId" }, // Use let to access the field
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$_id", "$$userId"] }, // Compare using $expr
							},
						},
						{ $project: { _id: 1, userName: 1, email: 1 } }, // Project only needed user fields
					],
					as: "user",
				},
			},
			{
				$project: {
					_id: 1,
					userName: { $arrayElemAt: ["$user.userName", 0] }, // Access userName from the user array
					email: { $arrayElemAt: ["$user.email", 0] }, // Access email from the user array
					appliedTo: 1,
					isAttended: 1,
				},
			},
		]);
		// console.log(attendances);
		const redisData = attendances.reduce((acc, item) => {
			const { _id, ...remainingData } = item;
			acc[_id] = JSON.stringify(remainingData);
			return acc;
		}, {});
		// console.log(redisData);
		setAllEventInRedis(eventId, redisData);
		res.status(200).json({
			attendances: attendances,
			message: "Fetched data successfully",
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			message: "Failed to fetch attendance data",
			error: error.message,
			success: false,
		});
	}
};

export const updateAttendance = async (req, res) => {
	try {
		const { eventId: ongoingEventId } = req.params;
		const { eventId, applicationId } = req.body;

		// Validate inputs
		if (!eventId || !applicationId) {
			return res.status(400).json({ message: "Invalid data" });
		}
		if (eventId !== ongoingEventId) {
			return res.status(404).json({ message: "User not registered to this event" });
		}

		// Get data from Redis for the event
		const key = `event:${eventId}`;
		const userData = await redisClient.hGet(key, applicationId);

		if (!userData) {
			return res.status(404).json({ message: "User not found for this event" });
		}

		// Parse user data and update `isAttended`
		const updatedData = JSON.parse(userData);
		updatedData.isAttended = true;

		// Save the updated data back to Redis
		await redisClient.hSet(key, applicationId, JSON.stringify(updatedData));
		// attendanceQueue.add({ applicationId }); //add an async task to the queue
		addAttendanceToQueue(applicationId);
		// Respond with updated data
		return res.status(200).json({
			message: "Attendance updated successfully",
			data: updatedData,
			success: true,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const closeAttendance = async (req, res) => {
	try {
		const { eventId } = req.body;

		if (!eventId) {
			return res.status(400).json({ message: "Event ID is required" });
		}

		const key = `event:${eventId}`;
		const attendanceData = await redisClient.hGetAll(key);

		if (!attendanceData) {
			return res.status(404).json({ message: "No data found for this event" });
		}
		console.log(attendanceData);
		// Parse Redis data and save to MongoDB
		const updates = Object.entries(attendanceData).map(async ([userId, userData]) => {
			const parsedData = JSON.parse(userData);
			return Application.findByIdAndUpdate(
				userId,
				{ isAttended: parsedData.isAttended },
				{ new: true }
			);
		});

		await Promise.all(updates);

		// Delete data from Redis after transferring to MongoDB
		await redisClient.del(key);

		return res.status(200).json({
			message: "Attendance data saved to MongoDB and cleared from Redis.",
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function setAllEventInRedis(eventId, attendanceData) {
	try {
		const redisKey = `event:${eventId}`; // Unique hash key for the event

		// Save each item to the Redis hash
		for (const [id, value] of Object.entries(attendanceData)) {
			const result = await redisClient.hSet(redisKey, id, value); // Use `hSet` to store key-value in hash
			console.log(`HSET Result: ${result}`); //result = 0 --> data is updated
		}

		//Redis hash expiration time: 2 hours in sec.
		await redisClient.expire(redisKey, 2 * 60 * 60);

		console.log(`Attendance data for event ${eventId} saved to Redis.`);
	} catch (error) {
		console.log("Error saving event data to Redis:", error.message);
	}
}

async function getAllEventFromRedis(eventId) {
	try {
		const redisKey = `event:${eventId}`;

		// Retrieve all attendance data for the event
		const attendanceHash = await redisClient.hGetAll(redisKey);

		// Parse JSON strings into objects
		const attendanceData = Object.entries(attendanceHash).map(([id, value]) => {
			const parsedValue = JSON.parse(value);
			return {
				id, // ID as the key
				userName: parsedValue.userName,
				isAttended: parsedValue.isAttended,
			};
		});

		console.log(`Attendance data for event ${eventId}:`, attendanceData);
		return attendanceData;
	} catch (error) {
		console.log("Error retrieving event data from Redis:", error.message);
	}
}
