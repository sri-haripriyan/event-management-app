import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/connectDB.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import { connectRedis } from "./redis/redis.js";
import { logger } from "./utils/logger.js";

dotenv.config();
const app = express();
app.use(
	cors({
		orgin: process.env.CLIENT_URL,
		credentials: true,
	})
);
app.use(express.json());
app.use("/attendance", attendanceRoutes);
app.get("/ping", (req, res) => {
	res.json({ message: "Hello from Vercel API!" });
});
app.get("/", (req, res) => {
	res.send("Backend running fine...");
});

connectDB()
	.then((conn) => {
		console.log("Database connected to :" + conn.connection.host);
		return connectRedis();
	})
	.then(() => {
		app.listen(process.env.PORT || 5000, () => {
			logger.info("Server running on: " + process.env.PORT || 5000);
		});
	})
	.catch((error) => {
		console.log(error);
		process.exit(1);
	});

/* app.listen(process.env.PORT || 5000, () => {
	connectDB();
	connectRedis();
	logger.info("Server running ");
}); */
