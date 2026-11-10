import mongoose from "mongoose";

// ** one setting value for one scope; see config/settings-registry.js for the allowed keys
const configSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    scope: {
      type: String,
      required: true,
      enum: ["global", "schemeType", "scheme", "trainingPartner"],
    },
    schemeType: { type: String, default: null },
    scheme: { type: String, default: null },
    trainingPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingPartner", default: null },
    // ** the redis hash field for this scope, e.g. "global", "scheme:PMKVY 4.0", "tp:<id>|scheme:<name>"
    target: { type: String, required: true },
    // ** only the fields this scope overrides; lower scopes fill in the rest
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    version: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, minimize: false }
);

configSchema.index({ key: 1, target: 1 }, { unique: true });

const Config = mongoose.model("Config", configSchema);
export default Config;
