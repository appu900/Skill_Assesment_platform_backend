import mongoose from "mongoose";
import Sequence from "../sequence.model.js";
import toaAccount from "./plugins/toaAccount.js";

// ** RailTel ToA training partner: its own collection, never shared with the skill portal's trainingpartners
const toaTrainingPartnerSchema = new mongoose.Schema(
  {
    tpCode: { type: String, unique: true },
    organizationName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    state: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    panNumber: { type: String, trim: true, uppercase: true },

    status: { type: String, enum: ["active", "suspended", "deactivated"], default: "active" },
    statusReason: { type: String, default: null },

    // ** every ToA TP is created by an admin; kept explicit for reports and audits
    createdByAdmin: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true, collection: "toa_training_partners" }
);

toaTrainingPartnerSchema.plugin(toaAccount, { role: "ToaTrainingPartner", tokenName: "organizationName" });

toaTrainingPartnerSchema.pre("save", async function number(next) {
  if (this.isNew && !this.tpCode) {
    const sequence = await Sequence.findByIdAndUpdate("toa_tp", { $inc: { seq: 1 } }, { new: true, upsert: true });
    this.tpCode = `TOA-TP-${String(sequence.seq).padStart(4, "0")}`;
  }
  next();
});

// ** why this account may not sign in right now (null = it may)
toaTrainingPartnerSchema.methods.signInBlockReason = function blockReason() {
  if (this.status === "suspended") return "This account is suspended. Please contact the CUTM admin.";
  if (this.status === "deactivated") return "This account is deactivated. Please contact the CUTM admin.";
  return null;
};

const ToaTrainingPartner = mongoose.model("ToaTrainingPartner", toaTrainingPartnerSchema);
export default ToaTrainingPartner;
