import mongoose from "mongoose";
import ToaTrainee, { TRAINEE_DOCUMENTS } from "../../models/toa/ToaTrainee.model.js";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import ToaBatch from "../../models/toa/ToaBatch.model.js";
import ToaAuthService, { ACTIVATION_TOKEN_DAYS } from "./ToaAuthService.js";
import { notify } from "./ToaNotificationService.js";
import sendEmail from "../email-service.js";
import serverConfig from "../../config/serverConfig.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { audit } from "../../utils/audit.js";
import { nextNumber, pad } from "../../utils/toa/sequence.js";
import { toaSettings } from "../../utils/toa/settings.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";
const PROFILE_FIELDS = ["name", "email", "mobile", "dob", "gender", "qualification", "experienceYears", "sector", "currentOrganisation", "designation", "address", "state", "idProofType", "idProofNumber"];
const REQUIRED_TO_SUBMIT = ["name", "email", "mobile", "dob", "gender", "qualification", "experienceYears", "sector", "idProofType", "idProofNumber"];
const REQUIRED_DOCUMENTS = ["photo", "idProof", "qualificationCertificate"];
const EDITABLE_STATUSES = ["draft", "correction_required"];
const DECISIONS = { approve: "approved", reject: "rejected", return: "correction_required" };

const ID_PATTERNS = {
  Aadhaar: /^\d{12}$/,
  PAN: /^[A-Z]{5}\d{4}[A-Z]$/,
  Passport: /^[A-Z]\d{7}$/,
  "Voter ID": /^[A-Z]{3}\d{7}$/,
  "Driving Licence": /^[A-Z]{2}\d{2}[A-Z0-9 -]{9,13}$/,
};

// ** cleans + validates the profile fields that are present; mandatory ones are checked on submit
function cleanProfile(data) {
  const out = {};
  for (const field of PROFILE_FIELDS) {
    if (data?.[field] === undefined || data[field] === null || data[field] === "") continue;
    out[field] = typeof data[field] === "string" ? data[field].trim() : data[field];
  }
  if (out.email !== undefined && !/^\S+@\S+\.\S+$/.test(out.email)) throw new AppError("email is not valid");
  if (out.mobile !== undefined && !/^[6-9]\d{9}$/.test(out.mobile)) throw new AppError("mobile must be a 10 digit Indian number");
  if (out.experienceYears !== undefined) {
    out.experienceYears = Number(out.experienceYears);
    if (!Number.isFinite(out.experienceYears) || out.experienceYears < 0 || out.experienceYears > 60) throw new AppError("experience must be 0-60 years");
  }
  if (out.dob !== undefined) {
    const dob = new Date(out.dob);
    const age = (Date.now() - dob.getTime()) / (365.25 * 86400000);
    if (Number.isNaN(dob.getTime()) || age < 18 || age > 80) throw new AppError("date of birth must make the assessor 18-80 years old");
    out.dob = dob;
  }
  if (out.idProofNumber !== undefined) {
    out.idProofNumber = String(out.idProofNumber).toUpperCase().replace(/\s+/g, out.idProofType === "Driving Licence" ? " " : "");
    const pattern = ID_PATTERNS[out.idProofType ?? data.idProofType];
    if (pattern && !pattern.test(out.idProofNumber)) throw new AppError(`${out.idProofType ?? data.idProofType} number is not valid`);
  }
  return out;
}

const duplicateMessage = (error) => {
  const field = Object.keys(error.keyPattern ?? {})[0];
  return { email: "an assessor with this email is already registered", mobile: "an assessor with this mobile number is already registered", idProofType: "an assessor with this ID proof is already registered" }[field] ?? "this assessor is already registered";
};

class ToaTraineeService {
  // ---------------------------------------------------------------- training partner

  async getOwned(id, tpId) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const trainee = await ToaTrainee.findOne({ _id: id, toaTpId: tpId });
    if (!trainee) throw AppError.notFound("assessor not found");
    return trainee;
  }

  async create(tpId, data, context) {
    const profile = cleanProfile(data);
    if (!profile.name || !profile.email || !profile.mobile) throw new AppError("name, email and mobile are needed to save a draft");
    const registrationId = `TOA-AS-${new Date().getFullYear()}-${pad(await nextNumber("toa_trainee"), 5)}`;
    try {
      const trainee = await ToaTrainee.create({ ...profile, toaTpId: tpId, registrationId, history: [{ status: "draft", byRole: ROLES.TOA_TRAINING_PARTNER, by: tpId }] });
      await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: "assessor_created", after: profile });
      return trainee;
    } catch (error) {
      if (error.code === 11000) throw AppError.conflict(duplicateMessage(error));
      throw error;
    }
  }

  async update(id, tpId, data, context) {
    const trainee = await this.getOwned(id, tpId);
    if (!EDITABLE_STATUSES.includes(trainee.status)) throw new AppError(`a ${trainee.status.replace("_", " ")} application cannot be edited`);
    const changes = cleanProfile({ ...data, idProofType: data.idProofType ?? trainee.idProofType });
    const before = Object.fromEntries(Object.keys(changes).map((field) => [field, trainee[field] ?? null]));
    Object.assign(trainee, changes);
    try {
      await trainee.save();
    } catch (error) {
      if (error.code === 11000) throw AppError.conflict(duplicateMessage(error));
      throw error;
    }
    await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: "assessor_updated", before, after: changes });
    return trainee;
  }

  async attachDocuments(id, tpId, files, context) {
    const trainee = await this.getOwned(id, tpId);
    if (!EDITABLE_STATUSES.includes(trainee.status)) throw new AppError("documents can only be changed on a draft or returned application");
    const uploaded = TRAINEE_DOCUMENTS.filter((name) => files?.[name]?.[0]);
    if (uploaded.length === 0) throw new AppError("no document was uploaded");
    if (files.photo?.[0] && !files.photo[0].mimetype.startsWith("image/")) throw new AppError("the photograph must be a JPG or PNG image");
    for (const name of uploaded) trainee.documents[name] = files[name][0].key;
    await trainee.save();
    await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: "assessor_documents_uploaded", after: { documents: uploaded } });
    return trainee;
  }

  async submit(id, tpId, context) {
    const trainee = await this.getOwned(id, tpId);
    if (!EDITABLE_STATUSES.includes(trainee.status)) throw new AppError("this application is already submitted");
    const missing = [...REQUIRED_TO_SUBMIT.filter((field) => trainee[field] === undefined || trainee[field] === null || trainee[field] === ""), ...REQUIRED_DOCUMENTS.filter((name) => !trainee.documents?.[name]).map((name) => `${name} document`)];
    if (missing.length) throw new AppError(`complete these before submitting: ${missing.join(", ")}`);
    trainee.status = "submitted";
    trainee.submittedAt = new Date();
    trainee.history.push({ status: "submitted", byRole: ROLES.TOA_TRAINING_PARTNER, by: tpId });
    await trainee.save();
    await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: "assessor_submitted" });
    return trainee;
  }

  async removeDraft(id, tpId, context) {
    const trainee = await this.getOwned(id, tpId);
    if (trainee.status !== "draft") throw new AppError("only drafts can be deleted");
    await trainee.deleteOne();
    await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: "assessor_draft_deleted", before: { name: trainee.name, registrationId: trainee.registrationId } });
    return true;
  }

  async listForTp(tpId, query = {}) {
    const filter = { toaTpId: tpId };
    if (query.status) filter.status = String(query.status);
    return ToaTrainee.find(filter).sort({ updatedAt: -1 });
  }

  // ---------------------------------------------------------------- CUTM admin

  async listForAdmin(query = {}) {
    const filter = {};
    if (query.status) filter.status = String(query.status);
    if (query.toaTpId && mongoose.isValidObjectId(query.toaTpId)) filter.toaTpId = query.toaTpId;
    return ToaTrainee.find(filter).sort({ submittedAt: -1, updatedAt: -1 }).populate("toaTpId", "organizationName tpCode");
  }

  async getForAdmin(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const trainee = await ToaTrainee.findById(id).populate("toaTpId", "organizationName tpCode email");
    if (!trainee) throw AppError.notFound("assessor not found");
    return trainee;
  }

  async startReview(id, adminId, context) {
    const trainee = await this.getForAdmin(id);
    if (trainee.status !== "submitted") throw new AppError("only submitted applications can be taken up for review");
    trainee.status = "under_review";
    trainee.history.push({ status: "under_review", byRole: ROLES.ADMIN, by: adminId });
    await trainee.save();
    await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: "assessor_under_review" });
    return trainee;
  }

  // ** approve / reject / return for correction, with remarks (required unless approving)
  async decide(id, decision, remarks, adminId, context) {
    const status = DECISIONS[decision];
    if (!status) throw new AppError("decision must be approve, reject or return");
    const trainee = await this.getForAdmin(id);
    if (!["submitted", "under_review"].includes(trainee.status)) throw new AppError("only submitted applications can be decided");
    const note = String(remarks ?? "").trim().slice(0, 1000);
    if (decision !== "approve" && !note) throw new AppError("Please add remarks for the training partner");
    const before = { status: trainee.status };
    trainee.status = status;
    trainee.remarks = note || null;
    trainee.decidedAt = new Date();
    trainee.history.push({ status, remarks: note || undefined, byRole: ROLES.ADMIN, by: adminId });

    let activationToken = null;
    if (status === "approved" && (await toaSettings(trainee.toaTpId._id)).assessorPortalEnabled) {
      trainee.portalEnabled = true;
      activationToken = await ToaAuthService.issueToken(trainee, ACTIVATION_TOKEN_DAYS * 24 * 60);
    }
    await trainee.save();
    await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: `assessor_${status}`, before, after: { status, remarks: note || null } });

    const tp = trainee.toaTpId;
    const verb = { approved: "approved", rejected: "rejected", correction_required: "returned for correction" }[status];
    await notify({
      role: ROLES.TOA_TRAINING_PARTNER,
      id: tp._id,
      email: tp.email,
      title: `Assessor ${trainee.name} ${verb}`,
      message: `CUTM has ${verb} the registration of ${trainee.name} (${trainee.registrationId}).${note ? ` Remarks: ${note}` : ""}`,
      link: `/toa/assessors?open=${trainee._id}`,
    });
    if (activationToken) {
      await sendEmail(
        SENDER_EMAIL,
        trainee.email,
        "Your RailTel ToA assessor account",
        [
          `Dear ${trainee.name},`,
          "",
          `Your registration ${trainee.registrationId} for the RailTel Training of Assessors programme has been approved by CUTM.`,
          `Set a password within ${ACTIVATION_TOKEN_DAYS} days to see your attendance, results and certificate:`,
          `${serverConfig.FRONTEND_URL}/reset-password?portal=toa-assessor&token=${activationToken}`,
          "",
          "CUTM Awarding Body",
        ].join("\n")
      );
    }
    return trainee;
  }

  // ** admin can switch the assessor login off (or on again, which sends a new activation link if needed)
  async setPortalAccess(id, enabled, adminId, context) {
    const trainee = await this.getForAdmin(id);
    if (trainee.status !== "approved") throw new AppError("only approved assessors can have portal access");
    trainee.portalEnabled = Boolean(enabled);
    if (!enabled) trainee.tokenVersion += 1;
    let token = null;
    if (enabled && !trainee.password) token = await ToaAuthService.issueToken(trainee, ACTIVATION_TOKEN_DAYS * 24 * 60);
    await trainee.save();
    if (token) {
      await sendEmail(SENDER_EMAIL, trainee.email, "Your RailTel ToA assessor account", `Dear ${trainee.name},\n\nSet a password for your RailTel ToA assessor account within ${ACTIVATION_TOKEN_DAYS} days:\n${serverConfig.FRONTEND_URL}/reset-password?portal=toa-assessor&token=${token}\n\nCUTM Awarding Body`);
    }
    await audit(context, { module: "toa", entity: "ToaTrainee", entityId: trainee._id, action: enabled ? "assessor_portal_enabled" : "assessor_portal_disabled" });
    return trainee;
  }

  // ** approved assessors of this TP that are not in another open batch (one programme at a time)
  async eligibleForBatch(tpId, excludeBatchId = null) {
    const busy = await ToaBatch.find({ toaTpId: tpId, status: { $nin: ["rejected", "completed"] }, ...(excludeBatchId ? { _id: { $ne: excludeBatchId } } : {}) }).distinct("trainees.trainee");
    return ToaTrainee.find({ toaTpId: tpId, status: "approved", _id: { $nin: busy } }).sort({ name: 1 });
  }

  static async tpOf(id) {
    return ToaTrainingPartner.findById(id).select("organizationName tpCode email").lean();
  }
}

export default ToaTraineeService;
