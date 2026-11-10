import mongoose from "mongoose";

export const TEMPLATE_TYPES = ["certificate", "invoice", "receipt", "attendance_sheet"];

// ** admin-edited HTML of a generated document, for every ToA partner (toaTpId null) or for one partner;
// ** lookup order: that partner's template -> the general one -> the built-in file
const toaTemplateSchema = new mongoose.Schema(
  {
    type: { type: String, enum: TEMPLATE_TYPES, required: true },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainingPartner", default: null },
    html: { type: String, required: true },
    version: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, collection: "toa_templates" }
);

toaTemplateSchema.index({ type: 1, toaTpId: 1 }, { unique: true });

const ToaTemplate = mongoose.model("ToaTemplate", toaTemplateSchema);
export default ToaTemplate;
