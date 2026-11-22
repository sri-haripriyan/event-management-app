import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
	{
		eventId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		isAttended: {
			type: Boolean,
			default: false,
		},
		qrCodeUrl: {
			type: String,
			default: "",
		},
		qrFileId: {
			type: String,
			default: "",
		},
		checkIn: {
			status: {
				type: String,
				enum: ["NOT_SCANNED", "SCANNED"],
				default: "NOT_SCANNED",
			},
			scannedAt: {
				type: Date,
				default: null,
			},
		},
		appliedTo: {
			type: String,
			required: true,
		},
		paymentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Payment",
		},
	},
	{ timestamps: true }
);

applicationSchema.index({ eventId: 1 });
applicationSchema.index({ eventId: 1, userId: 1, appliedTo: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
