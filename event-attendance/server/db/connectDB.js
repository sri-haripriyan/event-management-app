import mongoose from "mongoose";
const connectDB = () => {
	return mongoose.connect(process.env.MONGO_DB_URI);
};

export default connectDB;
