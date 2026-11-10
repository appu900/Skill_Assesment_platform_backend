import mongoose from "mongoose";

export const OFFLINE_TEMPLATE_TYPES = ["certificate", "attendance_sheet", "result_sheet", "id_card"];

// ** document format for a partner, a scheme, a partner + scheme, or everyone (both null);
// ** lookup: partner + scheme -> partner -> scheme -> default -> built-in file
const offlineTemplateSchema = new mongoose.Schema(
  {
    type: { type: String, enum: OFFLINE_TEMPLATE_TYPES, required: true },
    tp: { type: mongoose.Schema.Types.ObjectId, ref: "OfflineTrainingPartner", default: null },
    scheme: { type: String, default: null },
    html: { type: String, required: true },
    version: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, collection: "offline_templates" }
);

offlineTemplateSchema.index({ type: 1, tp: 1, scheme: 1 }, { unique: true });

const OfflineTemplate = mongoose.model("OfflineTemplate", offlineTemplateSchema);
export default OfflineTemplate;
