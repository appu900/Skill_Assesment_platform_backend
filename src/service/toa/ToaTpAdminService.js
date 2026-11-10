import mongoose from "mongoose";
import ToaTrainingPartnerRepository from "../../repository/toa/ToaTrainingPartner-repository.js";
import AuditLog from "../../models/AuditLog.model.js";
import sendEmail from "../email-service.js";
import serverConfig from "../../config/serverConfig.js";
import generatePassword from "../../utils/password.js";
import AppError from "../../utils/AppError.js";
import { audit } from "../../utils/audit.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";
const EDITABLE_FIELDS = ["organizationName", "contactPerson", "mobile", "address", "state", "gstNumber", "panNumber"];
const STATUSES = ["active", "suspended", "deactivated"];

const credentialsMail = (tp, password, intro) =>
  [
    `Dear ${tp.contactPerson},`,
    "",
    intro,
    "",
    `Login page: ${serverConfig.FRONTEND_URL}/login/toa`,
    `Email: ${tp.email}`,
    `Temporary password: ${password}`,
    "",
    "You will be asked to set your own password when you log in.",
    "",
    "CUTM Awarding Body",
  ].join("\n");

const pick = (source, fields) =>
  Object.fromEntries(fields.filter((field) => source?.[field] !== undefined).map((field) => [field, String(source[field]).trim()]));

// ** CUTM admin manages RailTel ToA training partner accounts
class ToaTpAdminService {
  constructor() {
    this.repository = new ToaTrainingPartnerRepository();
  }

  async getOrFail(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const tp = await this.repository.findById(id);
    if (!tp) throw AppError.notFound("training partner not found");
    return tp;
  }

  async create(data, adminId, context) {
    const fields = pick(data, [...EDITABLE_FIELDS, "email"]);
    if (!fields.organizationName || !fields.contactPerson || !fields.mobile) {
      throw new AppError("organization name, contact person and mobile are required");
    }
    if (!/^\S+@\S+\.\S+$/.test(fields.email ?? "")) throw new AppError("a valid email is required");
    if (!/^[6-9]\d{9}$/.test(fields.mobile)) throw new AppError("mobile must be a 10 digit Indian number");

    const password = generatePassword(12);
    let tp;
    try {
      tp = await this.repository.create({ ...fields, password, mustChangePassword: true, createdByAdmin: true, createdBy: adminId });
    } catch (error) {
      if (error.code === 11000) throw AppError.conflict("A ToA training partner already exists with this email");
      throw error;
    }
    await sendEmail(
      SENDER_EMAIL,
      tp.email,
      "Your RailTel ToA training partner account",
      credentialsMail(tp, password, `CUTM has created a RailTel Training of Assessors account for ${tp.organizationName} (${tp.tpCode}).`)
    );
    await audit(context, { module: "toa", entity: "ToaTrainingPartner", entityId: tp._id, action: "created", after: tp.toJSON() });
    return tp;
  }

  async list(query) {
    return this.repository.list({ status: query.status, search: query.search });
  }

  async get(id) {
    return this.getOrFail(id);
  }

  async update(id, data, context) {
    const tp = await this.getOrFail(id);
    const changes = pick(data, EDITABLE_FIELDS);
    if (changes.mobile && !/^[6-9]\d{9}$/.test(changes.mobile)) throw new AppError("mobile must be a 10 digit Indian number");
    const before = Object.fromEntries(Object.keys(changes).map((field) => [field, tp[field] ?? null]));
    Object.assign(tp, changes);
    await tp.save();
    await audit(context, { module: "toa", entity: "ToaTrainingPartner", entityId: tp._id, action: "updated", before, after: changes });
    return tp;
  }

  // ** suspending or deactivating ends every open session at once (tokenVersion)
  async setStatus(id, status, reason, context) {
    if (!STATUSES.includes(status)) throw new AppError(`status must be one of ${STATUSES.join(", ")}`);
    const tp = await this.getOrFail(id);
    if (tp.status === status) throw new AppError(`account is already ${status}`);
    if (status !== "active" && !String(reason ?? "").trim()) throw new AppError("Please give a reason");
    const before = { status: tp.status, statusReason: tp.statusReason };
    tp.status = status;
    tp.statusReason = status === "active" ? null : String(reason).trim().slice(0, 500);
    if (status !== "active") tp.tokenVersion += 1;
    await tp.save();
    await sendEmail(
      SENDER_EMAIL,
      tp.email,
      status === "active" ? "Your RailTel ToA account is active" : `Your RailTel ToA account is ${status}`,
      status === "active"
        ? `Dear ${tp.contactPerson},\n\nYour RailTel ToA account (${tp.tpCode}) is active again. You can log in at ${serverConfig.FRONTEND_URL}/login/toa.\n\nCUTM Awarding Body`
        : `Dear ${tp.contactPerson},\n\nYour RailTel ToA account (${tp.tpCode}) has been ${status} by CUTM.\nReason: ${tp.statusReason}\n\nPlease contact the CUTM admin for details.\n\nCUTM Awarding Body`
    );
    await audit(context, { module: "toa", entity: "ToaTrainingPartner", entityId: tp._id, action: `status_${status}`, before, after: { status, statusReason: tp.statusReason } });
    return tp;
  }

  async unlock(id, context) {
    const tp = await this.getOrFail(id);
    tp.failedLoginAttempts = 0;
    tp.lockUntil = null;
    await tp.save();
    await audit(context, { module: "toa", entity: "ToaTrainingPartner", entityId: tp._id, action: "unlocked" });
    return tp;
  }

  // ** new temporary password by email; the TP must change it at the next login
  async resetPassword(id, context) {
    const tp = await this.getOrFail(id);
    const password = generatePassword(12);
    tp.password = password;
    tp.mustChangePassword = true;
    tp.tokenVersion += 1;
    tp.failedLoginAttempts = 0;
    tp.lockUntil = null;
    tp.passwordResetTokenHash = null;
    tp.passwordResetExpires = null;
    await tp.save();
    await sendEmail(SENDER_EMAIL, tp.email, "Your new RailTel ToA password", credentialsMail(tp, password, "CUTM has reset the password of your RailTel ToA account."));
    await audit(context, { module: "toa", entity: "ToaTrainingPartner", entityId: tp._id, action: "password_reset_by_admin" });
    return true;
  }

  // ** newest first; filter by training partner, action or date range
  async auditLogs(query) {
    const filter = { module: "toa" };
    if (query.entityId && mongoose.isValidObjectId(query.entityId)) filter.entityId = query.entityId;
    if (query.action) filter.action = String(query.action);
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    return AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  }
}

export default ToaTpAdminService;
