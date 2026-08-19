import mongoose from "mongoose";
import logger from "../utils/logger.js";
const connectDB = () => {
	mongoose
		.connect(process.env.MONGO_DB_URI)
		.then(() => {
			logger.info("Database connected");
		})
		.catch((err) => {
			logger.error(err);
		});
};

export default connectDB;
