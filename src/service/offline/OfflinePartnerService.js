import mongoose from "mongoose";
import OfflineTrainingPartner from "../../models/offline/OfflineTrainingPartner.model.js";
import OfflineAssessor from "../../models/offline/OfflineAssessor.model.js";
import OfflineBatch from "../../models/offline/OfflineBatch.model.js";
import Scheme from "../../models/Scheme.js";
import AppError from "../../utils/AppError.js";
import { audit } from "../../utils/audit.js";
import { nextNumber, pad } from "../../utils/toa/sequence.js";

// ** the same details as the public training partner signup (no password: offline partners never log in)
const TP_FIELDS = [
  "organizationName", "category", "organizationCategory", "dateOfIncorporation", "affiliation", "pan", "prnNo", "scheme", "centerId",
  "registeredOfficeAddress", "registeredOfficeCity", "registeredOfficeDist", "registeredOfficeState", "registeredOfficePin",
  "registeredOfficeEmail", "registeredOfficeMobile", "registeredOfficeTelephone", "registeredOfficeGst", "website",
  "headOwnerName", "headOwnerDob", "headOwnerMobile", "headOwnerEmail", "headOwnerQualification", "headOwnerPanNo", "headOwnerAadharNo",
  "projectContactPersonName", "projectContactPersonDesignation", "projectContactPersonMobile", "projectContactPersonEmail",
  "sector", "courses", "notes",
];
const FORMATS = [
  [["pan", "headOwnerPanNo"], /^[A-Z]{5}\d{4}[A-Z]$/i, "PAN like ABCDE1234F"],
  [["registeredOfficeGst"], /^\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/i, "15 character GSTIN"],
  [["registeredOfficePin"], /^\d{6}$/, "6 digit PIN code"],
  [["registeredOfficeMobile", "headOwnerMobile", "projectContactPersonMobile"], /^[6-9]\d{9}$/, "10 digit Indian mobile number"],
  [["registeredOfficeEmail", "headOwnerEmail", "projectContactPersonEmail"], /^\S+@\S+\.\S+$/, "valid email"],
  [["headOwnerAadharNo"], /^\d{12}$/, "12 digit Aadhaar number"],
  [["website"], /^https?:\/\/\S+$/i, "web address starting with http:// or https://"],
];
const DATES = ["dateOfIncorporation", "headOwnerDob"];

const ASSESSOR_FIELDS = ["name", "email", "mobile", "qualification", "experienceYears", "sectors", "idProofType", "idProofNumber", "address", "bloodGroup", "validTill"];

const pick = (data, fields) =>
  Object.fromEntries(
    fields
      .filter((field) => data?.[field] !== undefined && data[field] !== null && data[field] !== "")
      .map((field) => [field, typeof data[field] === "string" ? data[field].trim() : data[field]])
  );

const log = (context, action, entity, entityId, extra = {}) => audit(context, { module: "offline", action, entity, entityId, ...extra });

// ** partners CUTM serves offline, and CUTM's own assessors
class OfflinePartnerService {
  async getTp(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const tp = await OfflineTrainingPartner.findById(id);
    if (!tp) throw AppError.notFound("training partner not found");
    return tp;
  }

  // ** checks formats of what is filled in and derives the scheme type from the scheme
  async cleanTp(data) {
    const fields = pick(data, TP_FIELDS);
    if (fields.category !== undefined && !["Corporate", "Government"].includes(fields.category)) throw new AppError("type must be Corporate or Government");
    for (const [names, pattern, label] of FORMATS) {
      for (const name of names) if (fields[name] !== undefined && !pattern.test(String(fields[name]))) throw new AppError(`${name}: enter a ${label}`);
    }
    for (const name of DATES) {
      if (fields[name] === undefined) continue;
      fields[name] = new Date(fields[name]);
      if (Number.isNaN(fields[name].getTime())) throw new AppError(`${name} is not a valid date`);
    }
    for (const name of ["sector", "courses"]) {
      if (fields[name] !== undefined) fields[name] = (Array.isArray(fields[name]) ? fields[name] : String(fields[name]).split(",")).map((value) => String(value).trim()).filter(Boolean);
    }
    if (fields.scheme) {
      const scheme = await Scheme.findOne({ name: fields.scheme }).select("schemeType").lean();
      if (!scheme) throw new AppError(`scheme ${fields.scheme} does not exist`);
      fields.schemeType = scheme.schemeType;
    }
    return fields;
  }

  async createTp(data, adminId, context) {
    const fields = await this.cleanTp(data);
    if (!fields.organizationName) throw new AppError("organisation name is required");
    if (!fields.category) throw new AppError("choose whether the partner is Government or Corporate");
    const tp = await OfflineTrainingPartner.create({ ...fields, tpCode: `OFF-TP-${pad(await nextNumber("offline_tp"), 4)}`, createdByAdmin: true, createdBy: adminId });
    await log(context, "offline_tp_created", "OfflineTrainingPartner", tp._id, { after: { organizationName: tp.organizationName, tpCode: tp.tpCode, category: tp.category, scheme: tp.scheme } });
    return tp;
  }

  async listTps() {
    const [tps, counts] = await Promise.all([
      OfflineTrainingPartner.find().sort({ createdAt: -1 }),
      OfflineBatch.aggregate([{ $group: { _id: "$tp", batches: { $sum: 1 }, published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } } } }]),
    ]);
    const countOf = new Map(counts.map((row) => [String(row._id), row]));
    return tps.map((doc) => doc.toJSON()).map((tp) => ({ ...tp, batches: countOf.get(String(tp._id))?.batches ?? 0, publishedBatches: countOf.get(String(tp._id))?.published ?? 0 }));
  }

  async updateTp(id, data, context) {
    const tp = await this.getTp(id);
    const changes = await this.cleanTp(data);
    if (data?.status !== undefined) {
      if (!["active", "inactive"].includes(data.status)) throw new AppError("status must be active or inactive");
      changes.status = data.status;
    }
    // ** the Aadhaar never goes into the audit log
    const logged = Object.keys(changes).filter((field) => field !== "headOwnerAadharNo");
    const before = Object.fromEntries(logged.map((field) => [field, tp[field] ?? null]));
    Object.assign(tp, changes);
    await tp.save();
    await log(context, "offline_tp_updated", "OfflineTrainingPartner", tp._id, { before, after: Object.fromEntries(logged.map((field) => [field, changes[field]])) });
    return tp;
  }

  // ---------------------------------------------------------------- assessors

  async getAssessor(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const assessor = await OfflineAssessor.findById(id);
    if (!assessor) throw AppError.notFound("assessor not found");
    return assessor;
  }

  clean(data) {
    const fields = pick(data, ASSESSOR_FIELDS);
    if (fields.mobile && !/^[6-9]\d{9}$/.test(fields.mobile)) throw new AppError("mobile must be a 10 digit Indian number");
    if (fields.email && !/^\S+@\S+\.\S+$/.test(fields.email)) throw new AppError("email is not valid");
    if (typeof fields.sectors === "string") fields.sectors = fields.sectors.split(",").map((sector) => sector.trim()).filter(Boolean);
    if (fields.experienceYears !== undefined) fields.experienceYears = Number(fields.experienceYears);
    if (fields.validTill !== undefined) {
      fields.validTill = new Date(fields.validTill);
      if (Number.isNaN(fields.validTill.getTime())) throw new AppError("valid-till date is not valid");
    }
    return fields;
  }

  async createAssessor(data, adminId, context) {
    const fields = this.clean(data);
    if (!fields.name || !fields.mobile) throw new AppError("name and mobile are required");
    try {
      const assessor = await OfflineAssessor.create({
        ...fields,
        assessorCode: `CUTM-AS-${pad(await nextNumber("offline_assessor"), 4)}`,
        validTill: fields.validTill ?? new Date(Date.now() + 365 * 86400000),
        createdBy: adminId,
      });
      await log(context, "offline_assessor_created", "OfflineAssessor", assessor._id, { after: { name: assessor.name, code: assessor.assessorCode } });
      return assessor;
    } catch (error) {
      if (error.code === 11000) throw AppError.conflict("an assessor with this mobile number already exists");
      throw error;
    }
  }

  async updateAssessor(id, data, context) {
    const assessor = await this.getAssessor(id);
    const changes = this.clean(data);
    if (data?.status) {
      if (!["active", "inactive"].includes(data.status)) throw new AppError("status must be active or inactive");
      changes.status = data.status;
    }
    Object.assign(assessor, changes);
    try {
      await assessor.save();
    } catch (error) {
      if (error.code === 11000) throw AppError.conflict("an assessor with this mobile number already exists");
      throw error;
    }
    await log(context, "offline_assessor_updated", "OfflineAssessor", assessor._id, { after: Object.keys(changes) });
    return assessor;
  }

  async setAssessorPhoto(id, file, context) {
    const assessor = await this.getAssessor(id);
    if (!file) throw new AppError("no photo was uploaded");
    if (!file.mimetype.startsWith("image/")) throw new AppError("the photo must be a JPG or PNG image");
    assessor.photoKey = file.key;
    await assessor.save();
    await log(context, "offline_assessor_photo", "OfflineAssessor", assessor._id);
    return assessor;
  }

  async listAssessors() {
    return OfflineAssessor.find().sort({ createdAt: -1 });
  }
}

export default OfflinePartnerService;
