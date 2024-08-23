import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    pdf: {
      type: String,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const Notification = new mongoose.model("Notification", NotificationSchema);
export default Notification;
