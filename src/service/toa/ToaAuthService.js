import crypto from "crypto";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import ToaTrainee from "../../models/toa/ToaTrainee.model.js";
import sendEmail from "../email-service.js";
import serverConfig from "../../config/serverConfig.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { audit } from "../../utils/audit.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
const RESET_TOKEN_MINUTES = 30;
export const ACTIVATION_TOKEN_DAYS = 7;

// ** at least 8 characters with a letter and a digit
export function assertStrongPassword(password) {
  const value = String(password ?? "");
  if (value.length < 8 || value.length > 64 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new AppError("password must be 8-64 characters and contain a letter and a number");
  }
  return value;
}

export const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

// ** the two kinds of ToA accounts share every login rule; only the model and the wording differ
const ACCOUNTS = {
  tp: { Model: ToaTrainingPartner, role: ROLES.TOA_TRAINING_PARTNER, entity: "ToaTrainingPartner", portal: "toa", greeting: (doc) => doc.contactPerson, label: "RailTel ToA training partner" },
  assessor: { Model: ToaTrainee, role: ROLES.TOA_ASSESSOR, entity: "ToaTrainee", portal: "toa-assessor", greeting: (doc) => doc.name, label: "RailTel ToA assessor" },
};

// ** login and password flows of one ToA account type
class ToaAuthService {
  constructor(kind = "tp") {
    this.account = ACCOUNTS[kind];
  }

  findByEmail(email) {
    return this.account.Model.findOne({ email: String(email).toLowerCase().trim() });
  }

  log(context, doc, action, extra = {}) {
    return audit(context, { module: "toa", entity: this.account.entity, entityId: doc._id, action, actorId: doc._id, actorRole: this.account.role, ...extra });
  }

  async login(email, password, context) {
    if (!email || !password) throw new AppError("Email and password are required");
    const doc = await this.findByEmail(email);
    if (!doc || !doc.password) throw AppError.unauthorized("Invalid email or password");
    if (doc.isLocked()) {
      const minutes = Math.ceil((doc.lockUntil - Date.now()) / 60000);
      throw new AppError(`Too many failed attempts. Try again in ${minutes} minute(s) or ask the admin to unlock the account.`, 423);
    }
    if (!doc.checkPassword(password)) {
      doc.failedLoginAttempts += 1;
      let locked = false;
      if (doc.failedLoginAttempts >= MAX_FAILED_LOGINS) {
        doc.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
        doc.failedLoginAttempts = 0;
        locked = true;
      }
      await doc.save();
      await this.log(context, doc, locked ? "account_locked" : "login_failed");
      throw AppError.unauthorized(locked ? `Too many failed attempts. The account is locked for ${LOCK_MINUTES} minutes.` : "Invalid email or password");
    }
    const blocked = doc.signInBlockReason();
    if (blocked) {
      await this.log(context, doc, "login_blocked", { note: blocked });
      throw AppError.forbidden(blocked);
    }
    doc.failedLoginAttempts = 0;
    doc.lockUntil = null;
    doc.lastLoginAt = new Date();
    await doc.save();
    await this.log(context, doc, "login");
    return { token: doc.generateJwt(), data: doc, mustChangePassword: doc.mustChangePassword };
  }

  // ** stores a hashed one-time token and returns the plain one for the email link
  static async issueToken(doc, minutes) {
    const token = crypto.randomBytes(32).toString("hex");
    doc.passwordResetTokenHash = hashToken(token);
    doc.passwordResetExpires = new Date(Date.now() + minutes * 60000);
    await doc.save();
    return token;
  }

  // ** always answers the same, so the form cannot be used to find out which emails exist
  async forgotPassword(email, context) {
    const doc = email ? await this.findByEmail(email) : null;
    if (doc && !doc.signInBlockReason()) {
      const token = await ToaAuthService.issueToken(doc, RESET_TOKEN_MINUTES);
      const link = `${serverConfig.FRONTEND_URL}/reset-password?portal=${this.account.portal}&token=${token}`;
      await sendEmail(
        SENDER_EMAIL,
        doc.email,
        `Reset your ${this.account.label} password`,
        [
          `Dear ${this.account.greeting(doc)},`,
          "",
          `We received a request to reset the password of your ${this.account.label} account.`,
          `Open this link within ${RESET_TOKEN_MINUTES} minutes to choose a new password:`,
          link,
          "",
          "If you did not ask for this, ignore this email; your password stays the same.",
          "",
          "CUTM Awarding Body",
        ].join("\n")
      );
      await this.log(context, doc, "password_reset_requested");
    }
    return { sent: true };
  }

  // ** also used to set the first password from an activation link
  async resetPassword(token, newPassword, context) {
    if (!token) throw new AppError("reset link is invalid or has expired");
    const doc = await this.account.Model.findOne({ passwordResetTokenHash: hashToken(token), passwordResetExpires: { $gt: new Date() } });
    if (!doc) throw new AppError("reset link is invalid or has expired");
    const firstPassword = !doc.password;
    doc.password = assertStrongPassword(newPassword);
    doc.passwordResetTokenHash = null;
    doc.passwordResetExpires = null;
    doc.mustChangePassword = false;
    doc.passwordChangedAt = new Date();
    doc.tokenVersion += 1;
    doc.failedLoginAttempts = 0;
    doc.lockUntil = null;
    await doc.save();
    await this.log(context, doc, firstPassword ? "account_activated" : "password_reset");
    return true;
  }

  // ** a new token is returned because the old one stops working with the password change
  async changePassword(id, currentPassword, newPassword, context) {
    const doc = await this.account.Model.findById(id);
    if (!doc) throw AppError.notFound("account not found");
    if (!doc.checkPassword(currentPassword ?? "")) throw new AppError("current password is wrong");
    const next = assertStrongPassword(newPassword);
    if (doc.checkPassword(next)) throw new AppError("the new password must be different from the current one");
    doc.password = next;
    doc.mustChangePassword = false;
    doc.passwordChangedAt = new Date();
    doc.tokenVersion += 1;
    await doc.save();
    await this.log(context, doc, "password_changed");
    return { token: doc.generateJwt(), data: doc };
  }

  async getProfile(id) {
    const doc = await this.account.Model.findById(id);
    if (!doc) throw AppError.notFound("account not found");
    return doc;
  }
}

export default ToaAuthService;
