import mongoose from "mongoose";

const toaCertificateSchema = new mongoose.Schema(
  {
    certificateNumber: { type: String, required: true, unique: true },
    // ** random code in the QR / verification link, not guessable from the number
    verifyCode: { type: String, required: true, unique: true },
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainee", required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "ToaBatch", required: true, index: true },
    result: { type: mongoose.Schema.Types.ObjectId, ref: "ToaResult", required: true },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    // ** printed values frozen at issue time
    snapshot: {
      name: String,
      registrationId: String,
      programmeName: String,
      batchCode: String,
      trainingPartner: String,
      startDate: Date,
      endDate: Date,
      score: Number,
      result: String,
    },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["valid", "revoked", "reissued"], default: "valid", index: true },
    statusReason: { type: String, default: null },
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: "ToaCertificate", default: null },
    replaces: { type: mongoose.Schema.Types.ObjectId, ref: "ToaCertificate", default: null },
    issuedBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true, collection: "toa_certificates" }
);

const ToaCertificate = mongoose.model("ToaCertificate", toaCertificateSchema);
export default ToaCertificate;
