import mongoose from "mongoose";
import ToaAdmin from "../../models/toa/ToaAdmin.model.js";
import sendEmail from "../email-service.js";
import serverConfig from "../../config/serverConfig.js";
import generatePassword from "../../utils/password.js";
import AppError from "../../utils/AppError.js";
import { audit } from "../../utils/audit.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";
const STATUSES = ["active", "suspended", "deactivated"];

const credentialsMail = (doc, password, intro) =>
  [
    `Dear ${doc.name},`,
    "",
    intro,
    "",
    `Login page: ${serverConfig.FRONTEND_URL}/login/toa-admin`,
    `Email: ${doc.email}`,
    `Temporary password: ${password}`,
    "",
    "You will be asked to set your own password when you log in.",
    "",
    "CUTM Awarding Body",
  ].join("\n");

// ** the CUTM admin creates and manages RailTel ToA admin accounts (it does not see ToA data itself)
class ToaAdminAccountService {
  async getOrFail(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const doc = await ToaAdmin.findById(id);
    if (!doc) throw AppError.notFound("ToA admin not found");
    return doc;
  }

  log(context, doc, action, extra = {}) {
    return audit(context, { module: "toa", entity: "ToaAdmin", entityId: doc._id, action, ...extra });
  }

  async create(data, adminId, context) {
    const name = String(data?.name ?? "").trim();
    const email = String(data?.email ?? "").trim().toLowerCase();
    const mobile = String(data?.mobile ?? "").trim();
    if (!name) throw new AppError("name is required");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError("a valid email is required");
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) throw new AppError("mobile must be a 10 digit Indian number");

    const password = generatePassword(12);
    let doc;
    try {
      doc = await ToaAdmin.create({ name, email, mobile: mobile || undefined, password, mustChangePassword: true, createdBy: adminId });
    } catch (error) {
      if (error.code === 11000) throw AppError.conflict("A ToA admin already exists with this email");
      throw error;
    }
    await sendEmail(SENDER_EMAIL, doc.email, "Your RailTel ToA admin account", credentialsMail(doc, password, "CUTM has created a RailTel Training of Assessors admin account for you."));
    await this.log(context, doc, "created", { after: doc.toJSON() });
    return doc;
  }

  list() {
    return ToaAdmin.find().sort({ createdAt: -1 });
  }

  // ** suspending or deactivating ends every open session at once (tokenVersion)
  async setStatus(id, status, reason, context) {
    if (!STATUSES.includes(status)) throw new AppError(`status must be one of ${STATUSES.join(", ")}`);
    const doc = await this.getOrFail(id);
    if (doc.status === status) throw new AppError(`account is already ${status}`);
    if (status !== "active" && !String(reason ?? "").trim()) throw new AppError("Please give a reason");
    const before = { status: doc.status };
    doc.status = status;
    doc.statusReason = status === "active" ? null : String(reason).trim().slice(0, 500);
    if (status !== "active") doc.tokenVersion += 1;
    await doc.save();
    await this.log(context, doc, `status_${status}`, { before, after: { status, statusReason: doc.statusReason } });
    return doc;
  }

  async unlock(id, context) {
    const doc = await this.getOrFail(id);
    doc.failedLoginAttempts = 0;
    doc.lockUntil = null;
    await doc.save();
    await this.log(context, doc, "unlocked");
    return doc;
  }

  // ** new temporary password by email; it must be changed at the next login
  async resetPassword(id, context) {
    const doc = await this.getOrFail(id);
    const password = generatePassword(12);
    Object.assign(doc, { password, mustChangePassword: true, failedLoginAttempts: 0, lockUntil: null, passwordResetTokenHash: null, passwordResetExpires: null });
    doc.tokenVersion += 1;
    await doc.save();
    await sendEmail(SENDER_EMAIL, doc.email, "Your new RailTel ToA admin password", credentialsMail(doc, password, "CUTM has reset the password of your RailTel ToA admin account."));
    await this.log(context, doc, "password_reset_by_admin");
    return true;
  }
}

export default ToaAdminAccountService;
