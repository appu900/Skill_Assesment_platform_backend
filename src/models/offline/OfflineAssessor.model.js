import mongoose from "mongoose";

// ** CUTM's own assessor (CUTM acts as the assessment agency for offline partners)
const offlineAssessorSchema = new mongoose.Schema(
  {
    assessorCode: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, max: 60 },
    sectors: [{ type: String, trim: true }],
    idProofType: { type: String, trim: true },
    idProofNumber: { type: String, trim: true, uppercase: true },
    address: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    photoKey: { type: String, default: null },
    validTill: { type: Date },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  {
    timestamps: true,
    collection: "offline_assessors",
    toJSON: {
      transform: (doc, ret) => {
        if (ret.idProofNumber) ret.idProofNumber = `XXXX${String(ret.idProofNumber).slice(-4)}`;
        return ret;
      },
    },
  }
);

offlineAssessorSchema.index({ mobile: 1 }, { unique: true });

const OfflineAssessor = mongoose.model("OfflineAssessor", offlineAssessorSchema);
export default OfflineAssessor;
