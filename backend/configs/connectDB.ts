import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI as string);
    logger.info("Database connected");
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

export default connectDB;
