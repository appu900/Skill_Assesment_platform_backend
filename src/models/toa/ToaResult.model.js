import mongoose from "mongoose";

const toaResultSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "ToaBatch", required: true },
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainee", required: true },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    result: { type: String, enum: ["Pass", "Fail", "Absent"], required: true },
    remarks: { type: String, default: null },
    status: { type: String, enum: ["draft", "approved", "published", "withheld"], default: "draft" },
    // ** why a published result has no certificate (attendance, payment ...)
    withheldReason: { type: String, default: null },
    enteredBy: mongoose.Schema.Types.ObjectId,
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvedAt: Date,
    publishedAt: Date,
  },
  { timestamps: true, collection: "toa_results" }
);

toaResultSchema.index({ batch: 1, trainee: 1 }, { unique: true });
toaResultSchema.index({ trainee: 1 });

const ToaResult = mongoose.model("ToaResult", toaResultSchema);
export default ToaResult;
