import mongoose from "mongoose";

export const PAYMENT_STATUSES = ["created", "pending", "successful", "failed", "cancelled", "refunded", "duplicate"];

const eventSchema = new mongoose.Schema({ type: String, source: String, at: { type: Date, default: Date.now }, detail: mongoose.Schema.Types.Mixed }, { _id: false });

// ** one gateway order (= one payment attempt) of an invoice
const toaPaymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "ToaInvoice", required: true, index: true },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    gateway: { type: String, enum: ["razorpay", "mock"], required: true },
    orderId: { type: String, required: true, unique: true },
    // ** unique: the same gateway payment can never be recorded twice
    paymentId: { type: String, default: undefined },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "created", index: true },
    method: { type: String, default: null },
    failureReason: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    receiptNumber: { type: String, default: null },
    refundId: { type: String, default: null },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, default: null },
    events: [eventSchema],
  },
  { timestamps: true, collection: "toa_payments" }
);

toaPaymentSchema.index({ paymentId: 1 }, { unique: true, partialFilterExpression: { paymentId: { $type: "string" } } });
toaPaymentSchema.index({ receiptNumber: 1 }, { unique: true, partialFilterExpression: { receiptNumber: { $type: "string" } } });

const ToaPayment = mongoose.model("ToaPayment", toaPaymentSchema);
export default ToaPayment;
