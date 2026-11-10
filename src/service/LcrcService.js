import LcrcRepository from "../repository/Lcrc-repository.js";
import sendEmail from "./email-service.js";
import serverConfig from "../config/serverConfig.js";
import generatePassword from "../utils/password.js";
import AppError from "../utils/AppError.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";

const credentialsMail = (name, email, password) =>
  [
    `Dear ${name},`,
    "",
    "Your LC/RC account on the CUTM Awarding Body portal is ready. You can approve corporate centres, batches and results from it.",
    "",
    `Login page: ${serverConfig.FRONTEND_URL}/login/lcrc`,
    `Email: ${email}`,
    `Password: ${password}`,
    "",
    "Please change this password after your first login (Profile > Change password).",
    "",
    "CUTM Awarding Body",
  ].join("\n");

// ** LC/RC accounts: the admin creates them, the generated password is emailed to the LC/RC
class LcrcService {
  constructor() {
    this.lcrcRepository = new LcrcRepository();
  }

  async getOrFail(id) {
    const lcrc = await this.lcrcRepository.get(id);
    if (!lcrc) {
      throw AppError.notFound("LC/RC account not found");
    }
    return lcrc;
  }

  async create(data) {
    const name = String(data?.name || "").trim();
    const email = String(data?.email || "").trim().toLowerCase();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new AppError("name and a valid email are required");
    }
    const password = generatePassword();
    try {
      const lcrc = await this.lcrcRepository.create({
        name,
        email,
        password,
        phone: data.phone ? String(data.phone).trim() : undefined,
        region: data.region ? String(data.region).trim() : undefined,
      });
      await sendEmail(SENDER_EMAIL, email, "Your LC/RC login - CUTM Awarding Body", credentialsMail(name, email, password));
      return lcrc;
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict("An LC/RC account already exists with this email");
      }
      throw error;
    }
  }

  async getAll() {
    return this.lcrcRepository.getAll();
  }

  async update(id, data) {
    await this.getOrFail(id);
    const changes = {};
    for (const field of ["name", "phone", "region"]) {
      if (data?.[field] !== undefined) changes[field] = String(data[field]).trim();
    }
    if (data?.isActive !== undefined) changes.isActive = Boolean(data.isActive);
    return this.lcrcRepository.update(id, changes);
  }

  // ** admin: new password, mailed again (e.g. the LC/RC forgot it)
  async resetPassword(id) {
    const lcrc = await this.getOrFail(id);
    const password = generatePassword();
    lcrc.password = password;
    await lcrc.save();
    await sendEmail(SENDER_EMAIL, lcrc.email, "Your new LC/RC password - CUTM Awarding Body", credentialsMail(lcrc.name, lcrc.email, password));
    return true;
  }

  async login(email, password) {
    if (!email || !password) {
      throw new AppError("Email and password are required");
    }
    const lcrc = await this.lcrcRepository.findByEmail(email);
    if (!lcrc || !lcrc.checkPassword(password)) {
      throw AppError.unauthorized("Invalid email or password");
    }
    if (!lcrc.isActive) {
      throw AppError.forbidden("This account is deactivated, please contact the admin");
    }
    return { data: lcrc, token: lcrc.generateJwt() };
  }

  async getProfile(id) {
    return this.getOrFail(id);
  }

  async changePassword(id, currentPassword, newPassword) {
    const lcrc = await this.getOrFail(id);
    if (!lcrc.checkPassword(currentPassword || "")) {
      throw new AppError("current password is wrong");
    }
    if (!newPassword || String(newPassword).length < 8) {
      throw new AppError("new password must be at least 8 characters");
    }
    lcrc.password = String(newPassword);
    await lcrc.save();
    return true;
  }
}

export default LcrcService;
