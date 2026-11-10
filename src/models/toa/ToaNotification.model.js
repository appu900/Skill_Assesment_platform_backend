import mongoose from "mongoose";

// ** on-portal notification for a ToA training partner or assessor
const toaNotificationSchema = new mongoose.Schema(
  {
    recipientRole: { type: String, enum: ["ToaTrainingPartner", "ToaAssessor"], required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "toa_notifications" }
);

toaNotificationSchema.index({ recipientRole: 1, recipientId: 1, createdAt: -1 });

const ToaNotification = mongoose.model("ToaNotification", toaNotificationSchema);
export default ToaNotification;
