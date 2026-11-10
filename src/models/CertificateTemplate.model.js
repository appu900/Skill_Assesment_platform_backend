import mongoose from "mongoose";

// ** certificate format of the normal TP flow, for a partner, a scheme, a partner + scheme, or everyone (both null);
// ** lookup: partner + scheme -> partner -> scheme -> default -> built-in file
const certificateTemplateSchema = new mongoose.Schema(
  {
    tp: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingPartner", default: null },
    scheme: { type: String, default: null },
    html: { type: String, required: true },
    version: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, collection: "certificate_templates" }
);

certificateTemplateSchema.index({ tp: 1, scheme: 1 }, { unique: true });

const CertificateTemplate = mongoose.model("CertificateTemplate", certificateTemplateSchema);
export default CertificateTemplate;
