import mongoose from "mongoose";

// ** one marks column of the result sheet; formats differ per partner, so the batch defines them
const componentSchema = new mongoose.Schema({ key: { type: String, required: true }, label: { type: String, required: true }, max: { type: Number, required: true, min: 1 } }, { _id: false });

const offlineBatchSchema = new mongoose.Schema(
  {
    batchCode: { type: String, unique: true },
    tp: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineTrainingPartner", required: true, index: true },
    // ** the partner's own batch id, printed on its documents
    externalBatchId: { type: String, trim: true },
    scheme: { type: String, trim: true },
    schemeType: { type: String, enum: ["Corporate", "State Government", "Central Government"] },
    jobRole: { type: String, required: true, trim: true },
    qpCode: { type: String, trim: true },
    nsqfLevel: { type: String, trim: true },
    sector: { type: String, trim: true },
    centreName: { type: String, trim: true },
    centreAddress: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    assessmentDate: { type: Date },
    assessor: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineAssessor", default: null },
    components: { type: [componentSchema], default: [{ key: "theory", label: "Theory", max: 50 }, { key: "practical", label: "Practical", max: 50 }] },
    passPercent: { type: Number, default: 50, min: 0, max: 100 },
    // ** scans of the signed originals the partner handed over
    attendanceSheetKey: { type: String, default: null },
    resultSheetKey: { type: String, default: null },
    status: { type: String, enum: ["draft", "assessed", "published"], default: "draft", index: true },
    publishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, collection: "offline_batches" }
);

const OfflineBatch = mongoose.model("OfflineBatch", offlineBatchSchema);
export default OfflineBatch;
