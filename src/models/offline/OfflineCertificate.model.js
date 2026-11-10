import mongoose from "mongoose";

const offlineCertificateSchema = new mongoose.Schema(
  {
    certificateNumber: { type: String, required: true, unique: true },
    verifyCode: { type: String, required: true, unique: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineCandidate", required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineBatch", required: true, index: true },
    tp: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineTrainingPartner", required: true },
    // ** printed values frozen at issue time
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["valid", "revoked"], default: "valid" },
    statusReason: { type: String, default: null },
  },
  { timestamps: true, collection: "offline_certificates" }
);

const OfflineCertificate = mongoose.model("OfflineCertificate", offlineCertificateSchema);
export default OfflineCertificate;
