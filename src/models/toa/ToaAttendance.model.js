import mongoose from "mongoose";

// ** one row per session and assessor
const toaAttendanceSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "ToaBatch", required: true },
    session: { type: mongoose.Schema.Types.ObjectId, required: true },
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainee", required: true },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ["present", "absent", "leave"], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId },
    markedByRole: { type: String },
  },
  { timestamps: true, collection: "toa_attendance" }
);

toaAttendanceSchema.index({ batch: 1, session: 1, trainee: 1 }, { unique: true });
toaAttendanceSchema.index({ trainee: 1 });

const ToaAttendance = mongoose.model("ToaAttendance", toaAttendanceSchema);
export default ToaAttendance;
