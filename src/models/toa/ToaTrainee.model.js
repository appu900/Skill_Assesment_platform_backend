import mongoose from "mongoose";
import toaAccount from "./plugins/toaAccount.js";

// ** a person a ToA training partner registers to be trained as an assessor ("assessor" in the RailTel FRD)
export const TRAINEE_STATUSES = ["draft", "submitted", "under_review", "correction_required", "approved", "rejected"];
export const TRAINEE_DOCUMENTS = ["photo", "idProof", "qualificationCertificate", "experienceProof"];

const historySchema = new mongoose.Schema(
  {
    status: String,
    remarks: String,
    byRole: String,
    by: mongoose.Schema.Types.ObjectId,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const toaTraineeSchema = new mongoose.Schema(
  {
    registrationId: { type: String, unique: true },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainingPartner", required: true, index: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, max: 60 },
    sector: { type: String, trim: true },
    currentOrganisation: { type: String, trim: true },
    designation: { type: String, trim: true },
    address: { type: String, trim: true },
    state: { type: String, trim: true },
    idProofType: { type: String, enum: ["Aadhaar", "PAN", "Passport", "Voter ID", "Driving Licence"] },
    // ** only the last 4 characters are ever sent to clients
    idProofNumber: { type: String, trim: true, uppercase: true },

    // ** private S3 keys (toa/<tpId>/trainees/...), downloaded through signed links only
    documents: {
      photo: { type: String, default: null },
      idProof: { type: String, default: null },
      qualificationCertificate: { type: String, default: null },
      experienceProof: { type: String, default: null },
    },

    status: { type: String, enum: TRAINEE_STATUSES, default: "draft", index: true },
    remarks: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null },
    history: [historySchema],

    // ** assessor login (FRD: "if enabled"); switched on when the application is approved
    portalEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "toa_trainees",
    toJSON: {
      transform: (doc, ret) => {
        if (ret.idProofNumber) ret.idProofNumber = `XXXX${String(ret.idProofNumber).slice(-4)}`;
        return ret;
      },
    },
  }
);

toaTraineeSchema.index({ idProofType: 1, idProofNumber: 1 }, { unique: true, partialFilterExpression: { idProofNumber: { $type: "string" } } });
toaTraineeSchema.plugin(toaAccount, { role: "ToaAssessor", tokenName: "name" });

toaTraineeSchema.methods.signInBlockReason = function blockReason() {
  if (!this.portalEnabled || this.status !== "approved") return "Portal access is not enabled for this account.";
  return null;
};

const ToaTrainee = mongoose.model("ToaTrainee", toaTraineeSchema);
export default ToaTrainee;
