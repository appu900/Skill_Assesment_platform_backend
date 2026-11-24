import mongoose from "mongoose";
import toaAccount from "./plugins/toaAccount.js";

// ** RailTel ToA administrator: its own login, sees only the ToA module (client, 2026-11-24).
// ** created by the CUTM admin; the same lockout / token version / forced password change rules as every ToA account
const toaAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    status: { type: String, enum: ["active", "suspended", "deactivated"], default: "active" },
    statusReason: { type: String, default: null },
    // ** the CUTM admin (Admin collection) who created the account
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true, collection: "toa_admins" }
);

toaAdminSchema.plugin(toaAccount, { role: "ToaAdmin", tokenName: "name" });

toaAdminSchema.methods.signInBlockReason = function blockReason() {
  if (this.status === "suspended") return "This account is suspended. Please contact the CUTM admin.";
  if (this.status === "deactivated") return "This account is deactivated. Please contact the CUTM admin.";
  return null;
};

const ToaAdmin = mongoose.model("ToaAdmin", toaAdminSchema);
export default ToaAdmin;
