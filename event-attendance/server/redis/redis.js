import Redis from "redis";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";
dotenv.config();

export const redisClient = Redis.createClient({
	url: process.env.REDIS_URL,
});

// Handle Redis errors
redisClient.on("error", (err) => console.log("❌ Redis Client Error:", err));

// Async function to connect to Redis
export const connectRedis = async () => {
	try {
		await redisClient.connect();
		logger.info("✅ Redis connected successfully");
		return redisClient;
	} catch (error) {
		logger.info("❌ Failed to connect to Redis:", error);
		process.exit(1); // Exit if Redis fails to connect
	}
};
