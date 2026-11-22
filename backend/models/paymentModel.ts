import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  razorpaySignature: { type: String, required: true },
  status: {
    type: String,
    enum: ["created", "paid", "failed", "refunded"],
    default: "paid",
  },
  amount: { type: Number },
  currency: { type: String, default: "INR" },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
  },
  groupIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

PaymentSchema.index({ razorpayPaymentId: 1 }, { unique: true });
PaymentSchema.index({ razorpayOrderId: 1 }, { unique: true });

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
