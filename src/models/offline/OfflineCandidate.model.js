import mongoose from "mongoose";

const offlineCandidateSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineBatch", required: true, index: true },
    enrollmentNumber: { type: String, unique: true },
    // ** the partner's own candidate id, if it has one
    candidateId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dob: { type: Date },
    mobile: { type: String, trim: true },
    category: { type: String, trim: true },
    attendance: { type: String, enum: ["present", "absent", null], default: null },
    // ** marks per batch component key, e.g. { theory: 41, practical: 38 }
    marks: { type: Map, of: Number, default: {} },
    total: { type: Number, default: null },
    percentage: { type: Number, default: null },
    grade: { type: String, default: null },
    result: { type: String, enum: ["Pass", "Fail", "Absent", null], default: null },
  },
  { timestamps: true, collection: "offline_candidates" }
);

offlineCandidateSchema.index({ batch: 1, candidateId: 1 }, { unique: true, partialFilterExpression: { candidateId: { $type: "string" } } });

const OfflineCandidate = mongoose.model("OfflineCandidate", offlineCandidateSchema);
export default OfflineCandidate;
