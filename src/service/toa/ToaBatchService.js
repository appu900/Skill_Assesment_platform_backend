import mongoose from "mongoose";
import ToaBatch from "../../models/toa/ToaBatch.model.js";
import ToaTrainee from "../../models/toa/ToaTrainee.model.js";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import ToaTraineeService from "./ToaTraineeService.js";
import ToaInvoiceService from "./ToaInvoiceService.js";
import { notify } from "./ToaNotificationService.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { audit } from "../../utils/audit.js";
import { nextNumber, pad, rosterIds } from "../../utils/toa/sequence.js";
import { toaSettings } from "../../utils/toa/settings.js";

const DETAIL_FIELDS = ["programmeName", "trainingMode", "startDate", "endDate", "schedule", "trainerName", "trainerMobile", "trainerEmail", "trainerQualification", "venue", "meetingLink", "capacity"];
const EDITABLE = ["draft", "returned"];
const DECISIONS = { approve: "approved", reject: "rejected", return: "returned" };
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

function cleanDetails(data) {
  const out = {};
  for (const field of DETAIL_FIELDS) {
    if (data?.[field] === undefined || data[field] === null || data[field] === "") continue;
    out[field] = typeof data[field] === "string" ? data[field].trim() : data[field];
  }
  if (out.trainingMode && !["Offline", "Online", "Hybrid"].includes(out.trainingMode)) throw new AppError("training mode must be Offline, Online or Hybrid");
  for (const field of ["startDate", "endDate"]) {
    if (out[field] !== undefined) {
      out[field] = new Date(out[field]);
      if (Number.isNaN(out[field].getTime())) throw new AppError(`${field} is not a valid date`);
    }
  }
  if (out.capacity !== undefined) {
    out.capacity = Number(out.capacity);
    if (!Number.isInteger(out.capacity) || out.capacity < 1) throw new AppError("capacity must be a whole number above 0");
  }
  if (out.trainerMobile && !/^[6-9]\d{9}$/.test(out.trainerMobile)) throw new AppError("trainer mobile must be a 10 digit Indian number");
  if (out.trainerEmail && !/^\S+@\S+\.\S+$/.test(out.trainerEmail)) throw new AppError("trainer email is not valid");
  if (out.meetingLink && !/^https:\/\/\S+$/.test(out.meetingLink)) throw new AppError("the meeting link must start with https://");
  return out;
}

class ToaBatchService {
  constructor() {
    this.traineeService = new ToaTraineeService();
    this.invoiceService = new ToaInvoiceService();
  }

  // ---------------------------------------------------------------- training partner

  async getOwned(id, tpId) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const batch = await ToaBatch.findOne({ _id: id, toaTpId: tpId });
    if (!batch) throw AppError.notFound("batch not found");
    return batch;
  }

  assertEditable(batch) {
    if (!EDITABLE.includes(batch.status)) throw new AppError(`a ${batch.status} batch cannot be changed`);
  }

  async assertDatesAndCapacity(batch) {
    if (batch.endDate < batch.startDate) throw new AppError("the end date cannot be before the start date");
    const { maxBatchCapacity } = await toaSettings(batch.toaTpId);
    if (batch.capacity > maxBatchCapacity) throw new AppError(`capacity cannot be more than ${maxBatchCapacity}`);
    if (batch.trainees.length > batch.capacity) throw new AppError(`the batch has ${batch.trainees.length} assessors but a capacity of ${batch.capacity}`);
  }

  async create(tpId, data, context) {
    const details = cleanDetails(data);
    for (const field of ["programmeName", "trainingMode", "startDate", "endDate", "capacity"]) {
      if (details[field] === undefined) throw new AppError(`${field} is required`);
    }
    const year = new Date().getFullYear();
    const batch = new ToaBatch({
      ...details,
      toaTpId: tpId,
      batchCode: `TOA-B-${year}-${pad(await nextNumber(`toa_batch_${year}`), 4)}`,
      history: [{ status: "draft", byRole: ROLES.TOA_TRAINING_PARTNER, by: tpId }],
    });
    await this.assertDatesAndCapacity(batch);
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "batch_created", after: details });
    return batch;
  }

  async update(id, tpId, data, context) {
    const batch = await this.getOwned(id, tpId);
    this.assertEditable(batch);
    const changes = cleanDetails(data);
    const before = Object.fromEntries(Object.keys(changes).map((field) => [field, batch[field] ?? null]));
    Object.assign(batch, changes);
    await this.assertDatesAndCapacity(batch);
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "batch_updated", before, after: changes });
    return batch;
  }

  // ** replaces the roster; only this TP's approved assessors that are not in another open batch, no duplicates
  async setTrainees(id, tpId, traineeIds, context) {
    const batch = await this.getOwned(id, tpId);
    this.assertEditable(batch);
    const ids = (Array.isArray(traineeIds) ? traineeIds : []).map(String);
    if (new Set(ids).size !== ids.length) throw new AppError("the same assessor is selected twice");
    if (ids.some((value) => !mongoose.isValidObjectId(value))) throw new AppError("invalid assessor id");
    const eligible = new Set((await this.traineeService.eligibleForBatch(tpId, batch._id)).map((trainee) => String(trainee._id)));
    const refused = ids.filter((value) => !eligible.has(value));
    if (refused.length) {
      const names = await ToaTrainee.find({ _id: { $in: refused } }).select("name status toaTpId").lean();
      const reason = names.map((trainee) => (String(trainee.toaTpId) !== String(tpId) ? "an assessor of another partner" : trainee.status !== "approved" ? `${trainee.name} (not approved)` : `${trainee.name} (already in another batch)`));
      throw new AppError(`these assessors cannot be added: ${reason.join(", ") || "unknown assessors"}`);
    }
    if (ids.length > batch.capacity) throw new AppError(`the batch capacity is ${batch.capacity}`);
    const before = rosterIds(batch);
    const kept = new Map(batch.trainees.map((entry) => [String(entry.trainee?._id ?? entry.trainee), entry]));
    batch.trainees = ids.map((value) => kept.get(value) ?? { trainee: value });
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "batch_roster_changed", before: { trainees: before }, after: { trainees: ids } });
    return batch;
  }

  // ** replaces the session plan (dates inside the batch period, HH:MM times)
  async setSessions(id, tpId, sessions, context) {
    const batch = await this.getOwned(id, tpId);
    this.assertEditable(batch);
    if (!Array.isArray(sessions) || sessions.length === 0) throw new AppError("add at least one session");
    if (sessions.length > 200) throw new AppError("too many sessions");
    const clean = sessions.map((session, index) => {
      const date = new Date(session.date);
      if (Number.isNaN(date.getTime())) throw new AppError(`session ${index + 1}: date is not valid`);
      if (startOfDay(date) < startOfDay(batch.startDate) || startOfDay(date) > startOfDay(batch.endDate)) throw new AppError(`session ${index + 1}: the date is outside the batch dates`);
      for (const field of ["startTime", "endTime"]) {
        if (session[field] && !TIME.test(session[field])) throw new AppError(`session ${index + 1}: ${field} must be HH:MM`);
      }
      if (session.startTime && session.endTime && session.endTime <= session.startTime) throw new AppError(`session ${index + 1}: it must end after it starts`);
      return { date, startTime: session.startTime || undefined, endTime: session.endTime || undefined, topic: String(session.topic ?? "").trim().slice(0, 200) || undefined };
    });
    clean.sort((a, b) => a.date - b.date || String(a.startTime).localeCompare(String(b.startTime)));
    batch.sessions = clean;
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "batch_sessions_changed", after: { sessions: clean.length } });
    return batch;
  }

  async submit(id, tpId, context) {
    const batch = await this.getOwned(id, tpId);
    this.assertEditable(batch);
    const problems = [];
    if (!batch.trainerName) problems.push("trainer name");
    if (["Offline", "Hybrid"].includes(batch.trainingMode) && !batch.venue) problems.push("venue");
    if (["Online", "Hybrid"].includes(batch.trainingMode) && !batch.meetingLink) problems.push("online meeting link");
    if (batch.trainees.length === 0) problems.push("at least one assessor");
    if (batch.sessions.length === 0) problems.push("the session plan");
    if (problems.length) throw new AppError(`complete these before submitting: ${problems.join(", ")}`);
    if (startOfDay(batch.endDate) < startOfDay(new Date())) throw new AppError("the batch has already ended; correct the dates");
    await this.assertDatesAndCapacity(batch);
    const approved = await ToaTrainee.countDocuments({ _id: { $in: rosterIds(batch) }, toaTpId: tpId, status: "approved" });
    if (approved !== batch.trainees.length) throw new AppError("some assessors in the batch are no longer approved; update the roster");

    const now = new Date();
    batch.submissionRef = `TOA-SUB-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${pad(await nextNumber("toa_submission"), 5)}`;
    batch.status = "submitted";
    batch.submittedAt = now;
    batch.remarks = null;
    batch.history.push({ status: "submitted", reference: batch.submissionRef, byRole: ROLES.TOA_TRAINING_PARTNER, by: tpId });
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "batch_submitted", after: { submissionRef: batch.submissionRef } });
    return batch;
  }

  async removeDraft(id, tpId, context) {
    const batch = await this.getOwned(id, tpId);
    if (batch.status !== "draft" || batch.history.some((entry) => entry.status === "submitted")) throw new AppError("only never-submitted drafts can be deleted");
    await batch.deleteOne();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "batch_draft_deleted", before: { batchCode: batch.batchCode } });
    return true;
  }

  async listForTp(tpId, query = {}) {
    const filter = { toaTpId: tpId };
    if (query.status) filter.status = String(query.status);
    return ToaBatch.find(filter).sort({ updatedAt: -1 });
  }

  async detail(batch) {
    await batch.populate("trainees.trainee", "name registrationId email mobile status documents.photo");
    return batch;
  }

  // ---------------------------------------------------------------- CUTM admin

  async getForAdmin(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const batch = await ToaBatch.findById(id).populate("toaTpId", "organizationName tpCode email");
    if (!batch) throw AppError.notFound("batch not found");
    return batch;
  }

  async listForAdmin(query = {}) {
    const filter = {};
    if (query.status) filter.status = String(query.status);
    if (query.toaTpId && mongoose.isValidObjectId(query.toaTpId)) filter.toaTpId = query.toaTpId;
    return ToaBatch.find(filter).sort({ submittedAt: -1, updatedAt: -1 }).populate("toaTpId", "organizationName tpCode");
  }

  async startReview(id, adminId, context) {
    const batch = await this.getForAdmin(id);
    if (batch.status !== "submitted") throw new AppError("only submitted batches can be taken up for review");
    batch.status = "under_review";
    batch.history.push({ status: "under_review", byRole: ROLES.ADMIN, by: adminId });
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "batch_under_review" });
    return batch;
  }

  async decide(id, decision, remarks, adminId, context) {
    const status = DECISIONS[decision];
    if (!status) throw new AppError("decision must be approve, reject or return");
    const batch = await this.getForAdmin(id);
    if (!["submitted", "under_review"].includes(batch.status)) throw new AppError("only submitted batches can be decided");
    const note = String(remarks ?? "").trim().slice(0, 1000);
    if (decision !== "approve" && !note) throw new AppError("Please add remarks for the training partner");
    const before = { status: batch.status };
    batch.status = status;
    batch.remarks = note || null;
    if (status === "approved") batch.approvedAt = new Date();
    batch.history.push({ status, remarks: note || undefined, reference: batch.submissionRef, byRole: ROLES.ADMIN, by: adminId });
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: `batch_${status}`, before, after: { status, remarks: note || null } });

    const tp = batch.toaTpId;
    const verb = { approved: "approved", rejected: "rejected", returned: "returned for correction" }[status];
    await notify({
      role: ROLES.TOA_TRAINING_PARTNER,
      id: tp._id,
      email: tp.email,
      title: `Batch ${batch.batchCode} ${verb}`,
      message: `CUTM has ${verb} batch ${batch.batchCode} (${batch.submissionRef}).${note ? ` Remarks: ${note}` : ""}${status === "approved" ? " Attendance can now be recorded and the invoice is ready." : ""}`,
      link: `/toa/batches/${batch._id}`,
    });
    if (status === "approved") await this.invoiceService.createForBatch(batch, context);
    return batch;
  }

  static async tpName(id) {
    return (await ToaTrainingPartner.findById(id).select("organizationName").lean())?.organizationName;
  }
}

export default ToaBatchService;
