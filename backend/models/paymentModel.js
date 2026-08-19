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
  createdAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
