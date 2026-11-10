import mongoose from "mongoose";
import OfflineBatch from "../../models/offline/OfflineBatch.model.js";
import OfflineCandidate from "../../models/offline/OfflineCandidate.model.js";
import OfflineTrainingPartner from "../../models/offline/OfflineTrainingPartner.model.js";
import OfflineAssessor from "../../models/offline/OfflineAssessor.model.js";
import AppError from "../../utils/AppError.js";
import { audit } from "../../utils/audit.js";
import { nextNumber, pad } from "../../utils/toa/sequence.js";
import { readSheet, workbookBuffer } from "../../utils/toa/excel.js";

const BATCH_FIELDS = ["externalBatchId", "scheme", "schemeType", "jobRole", "qpCode", "nsqfLevel", "sector", "centreName", "centreAddress", "district", "state", "startDate", "endDate", "assessmentDate", "passPercent"];
const CANDIDATE_FIELDS = ["candidateId", "name", "fatherName", "gender", "dob", "mobile", "category"];
const DATE_FIELDS = ["startDate", "endDate", "assessmentDate", "dob"];
const SCHEME_TYPES = ["Corporate", "State Government", "Central Government"];

const log = (context, action, entity, entityId, extra = {}) => audit(context, { module: "offline", action, entity, entityId, ...extra });

function clean(data, fields) {
  const out = {};
  for (const field of fields) {
    const value = data?.[field];
    if (value === undefined || value === null || value === "") continue;
    out[field] = typeof value === "string" ? value.trim() : value;
    if (DATE_FIELDS.includes(field)) {
      out[field] = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(out[field].getTime())) throw new AppError(`${field} is not a valid date`);
    }
  }
  return out;
}

// ** grade from the percentage; Pass needs attendance and the batch pass mark
export function grade(percentage, passPercent) {
  if (percentage >= 85) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= passPercent) return "D";
  return "F";
}

class OfflineBatchService {
  async get(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const batch = await OfflineBatch.findById(id).populate("tp").populate("assessor");
    if (!batch) throw AppError.notFound("batch not found");
    return batch;
  }

  assertOpen(batch) {
    if (batch.status === "published") throw new AppError("this batch is published; revoke certificates to correct it");
  }

  validateBatch(fields) {
    if (fields.schemeType && !SCHEME_TYPES.includes(fields.schemeType)) throw new AppError(`scheme type must be ${SCHEME_TYPES.join(", ")}`);
    if (fields.passPercent !== undefined) {
      fields.passPercent = Number(fields.passPercent);
      if (!(fields.passPercent >= 0 && fields.passPercent <= 100)) throw new AppError("pass mark must be 0-100");
    }
    if (fields.startDate && fields.endDate && fields.endDate < fields.startDate) throw new AppError("the end date cannot be before the start date");
  }

  // ** marks columns of the result sheet, e.g. Theory 40 / Practical 50 / Viva 10
  cleanComponents(components) {
    if (components === undefined) return undefined;
    if (!Array.isArray(components) || components.length === 0 || components.length > 10) throw new AppError("add 1 to 10 mark components");
    const seen = new Set();
    return components.map((component) => {
      const label = String(component.label ?? "").trim();
      const max = Number(component.max);
      if (!label || !(max > 0 && max <= 1000)) throw new AppError("each mark component needs a name and a maximum above 0");
      const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "marks";
      if (seen.has(key)) throw new AppError(`the component ${label} appears twice`);
      seen.add(key);
      return { key, label, max };
    });
  }

  async create(data, adminId, context) {
    if (!mongoose.isValidObjectId(data?.tp)) throw new AppError("choose the training partner");
    const tp = await OfflineTrainingPartner.findById(data.tp);
    if (!tp) throw AppError.notFound("training partner not found");
    if (tp.status !== "active") throw new AppError("this training partner is inactive");
    const fields = clean(data, BATCH_FIELDS);
    if (!fields.jobRole) throw new AppError("job role is required");
    this.validateBatch(fields);
    const components = this.cleanComponents(data.components);
    const year = new Date().getFullYear();
    const batch = await OfflineBatch.create({ ...fields, ...(components ? { components } : {}), tp: tp._id, batchCode: `OFF-B-${year}-${pad(await nextNumber(`offline_batch_${year}`), 4)}`, createdBy: adminId });
    await log(context, "offline_batch_created", "OfflineBatch", batch._id, { after: { ...fields, tp: tp.tpCode } });
    return batch;
  }

  async update(id, data, context) {
    const batch = await this.get(id);
    this.assertOpen(batch);
    const changes = clean(data, BATCH_FIELDS);
    this.validateBatch({ ...changes, startDate: changes.startDate ?? batch.startDate, endDate: changes.endDate ?? batch.endDate });
    if (data?.assessor !== undefined) {
      if (data.assessor === null || data.assessor === "") changes.assessor = null;
      else {
        const assessor = mongoose.isValidObjectId(data.assessor) ? await OfflineAssessor.findById(data.assessor) : null;
        if (!assessor) throw AppError.notFound("assessor not found");
        if (assessor.status !== "active") throw new AppError("this assessor is inactive");
        changes.assessor = assessor._id;
      }
    }
    const components = this.cleanComponents(data?.components);
    if (components) {
      const marked = await OfflineCandidate.countDocuments({ batch: batch._id, total: { $ne: null } });
      if (marked) throw new AppError("marks are already entered; clear them before changing the components");
      changes.components = components;
    }
    const before = Object.fromEntries(Object.keys(changes).map((field) => [field, batch[field]?._id ?? batch[field] ?? null]));
    Object.assign(batch, changes);
    await batch.save();
    await log(context, "offline_batch_updated", "OfflineBatch", batch._id, { before, after: changes });
    return this.get(id);
  }

  async list(query = {}) {
    const filter = {};
    if (mongoose.isValidObjectId(query.tp)) filter.tp = query.tp;
    if (query.status) filter.status = String(query.status);
    const batches = await OfflineBatch.find(filter).sort({ createdAt: -1 }).populate("tp", "organizationName tpCode category").populate("assessor", "name assessorCode").lean();
    const counts = await OfflineCandidate.aggregate([{ $match: { batch: { $in: batches.map((batch) => batch._id) } } }, { $group: { _id: "$batch", candidates: { $sum: 1 }, passed: { $sum: { $cond: [{ $eq: ["$result", "Pass"] }, 1, 0] } } } }]);
    const countOf = new Map(counts.map((row) => [String(row._id), row]));
    return batches.map((batch) => ({ ...batch, candidates: countOf.get(String(batch._id))?.candidates ?? 0, passed: countOf.get(String(batch._id))?.passed ?? 0 }));
  }

  async remove(id, context) {
    const batch = await this.get(id);
    if (batch.status === "published") throw new AppError("a published batch cannot be deleted");
    await OfflineCandidate.deleteMany({ batch: batch._id });
    await batch.deleteOne();
    await log(context, "offline_batch_deleted", "OfflineBatch", batch._id, { before: { batchCode: batch.batchCode } });
    return true;
  }

  async attachSheet(id, kind, file, context) {
    const batch = await this.get(id);
    if (!file) throw new AppError("no file was uploaded");
    batch[kind === "result" ? "resultSheetKey" : "attendanceSheetKey"] = file.key;
    await batch.save();
    await log(context, `offline_${kind}_sheet_uploaded`, "OfflineBatch", batch._id);
    return batch;
  }

  // ---------------------------------------------------------------- candidates

  candidates(batchId) {
    return OfflineCandidate.find({ batch: batchId }).sort({ createdAt: 1 });
  }

  async enrollmentNumber() {
    const year = new Date().getFullYear();
    return `OFF-C-${year}-${pad(await nextNumber(`offline_candidate_${year}`), 5)}`;
  }

  checkCandidate(fields) {
    if (fields.gender && !["Male", "Female", "Other"].includes(fields.gender)) throw new AppError("gender must be Male, Female or Other");
    if (fields.mobile && !/^[6-9]\d{9}$/.test(String(fields.mobile))) throw new AppError(`mobile ${fields.mobile} is not a 10 digit Indian number`);
  }

  async addCandidate(batchId, data, context) {
    const batch = await this.get(batchId);
    this.assertOpen(batch);
    const fields = clean(data, CANDIDATE_FIELDS);
    if (!fields.name) throw new AppError("candidate name is required");
    this.checkCandidate(fields);
    try {
      const candidate = await OfflineCandidate.create({ ...fields, batch: batch._id, enrollmentNumber: await this.enrollmentNumber() });
      await log(context, "offline_candidate_added", "OfflineBatch", batch._id, { after: { name: candidate.name, enrollmentNumber: candidate.enrollmentNumber } });
      return candidate;
    } catch (error) {
      if (error.code === 11000) throw AppError.conflict(`candidate ID ${fields.candidateId} is already in this batch`);
      throw error;
    }
  }

  async updateCandidate(batchId, candidateId, data, context) {
    const batch = await this.get(batchId);
    this.assertOpen(batch);
    const candidate = mongoose.isValidObjectId(candidateId) ? await OfflineCandidate.findOne({ _id: candidateId, batch: batch._id }) : null;
    if (!candidate) throw AppError.notFound("candidate not found");
    const changes = clean(data, CANDIDATE_FIELDS);
    this.checkCandidate(changes);
    Object.assign(candidate, changes);
    await candidate.save();
    await log(context, "offline_candidate_updated", "OfflineBatch", batch._id, { after: { candidate: candidate.enrollmentNumber, ...changes } });
    return candidate;
  }

  async removeCandidate(batchId, candidateId, context) {
    const batch = await this.get(batchId);
    this.assertOpen(batch);
    const candidate = await OfflineCandidate.findOneAndDelete({ _id: candidateId, batch: batch._id });
    if (!candidate) throw AppError.notFound("candidate not found");
    await log(context, "offline_candidate_removed", "OfflineBatch", batch._id, { before: { name: candidate.name, enrollmentNumber: candidate.enrollmentNumber } });
    return true;
  }

  candidateTemplate() {
    return workbookBuffer(
      "Candidates",
      [
        { header: "Candidate ID", key: "candidateId", width: 18 },
        { header: "Name", key: "name", width: 28 },
        { header: "Father's name", key: "fatherName", width: 28 },
        { header: "Gender (Male/Female/Other)", key: "gender", width: 16 },
        { header: "Date of birth (YYYY-MM-DD)", key: "dob", width: 18 },
        { header: "Mobile", key: "mobile", width: 14 },
        { header: "Category", key: "category", width: 12 },
      ],
      [],
      { title: "Candidates – one row per candidate (Name is required)" }
    );
  }

  // ** the partner's candidate list from Excel; every row is checked first, nothing is saved if one is wrong
  async importCandidates(batchId, buffer, context) {
    const batch = await this.get(batchId);
    this.assertOpen(batch);
    if (!buffer) throw new AppError("upload the filled candidate template");
    let rows;
    try {
      rows = await readSheet(buffer, "Name");
    } catch {
      throw new AppError("the file is not a valid Excel (.xlsx) workbook");
    }
    const existing = new Set((await OfflineCandidate.find({ batch: batch._id }).select("candidateId").lean()).map((row) => row.candidateId).filter(Boolean));
    const errors = [];
    const entries = [];
    rows.forEach((row, index) => {
      const line = index + 1;
      const name = String(row.Name ?? "").trim();
      if (!name && !Object.values(row).some((value) => String(value ?? "").trim())) return;
      if (!name) return errors.push(`row ${line}: name is missing`);
      const dobRaw = row["Date of birth (YYYY-MM-DD)"];
      const entry = {
        candidateId: String(row["Candidate ID"] ?? "").trim() || undefined,
        name,
        fatherName: String(row["Father's name"] ?? "").trim() || undefined,
        gender: String(row["Gender (Male/Female/Other)"] ?? "").trim() || undefined,
        dob: dobRaw ? new Date(dobRaw) : undefined,
        mobile: String(row.Mobile ?? "").trim() || undefined,
        category: String(row.Category ?? "").trim() || undefined,
      };
      if (entry.dob && Number.isNaN(entry.dob.getTime())) return errors.push(`row ${line}: date of birth is not a date`);
      try {
        this.checkCandidate(entry);
      } catch (error) {
        return errors.push(`row ${line}: ${error.message}`);
      }
      if (entry.candidateId && (existing.has(entry.candidateId) || entries.some((item) => item.candidateId === entry.candidateId))) return errors.push(`row ${line}: candidate ID ${entry.candidateId} appears twice`);
      entries.push(entry);
    });
    if (errors.length) throw new AppError(`the file has errors, nothing was saved: ${errors.slice(0, 15).join("; ")}`);
    if (!entries.length) throw new AppError("no candidate rows found; use the downloaded template");
    for (const entry of entries) entry.enrollmentNumber = await this.enrollmentNumber();
    await OfflineCandidate.insertMany(entries.map((entry) => ({ ...entry, batch: batch._id })));
    await log(context, "offline_candidates_imported", "OfflineBatch", batch._id, { after: { count: entries.length } });
    return { imported: entries.length };
  }

  // ---------------------------------------------------------------- assessment

  // ** attendance + marks per candidate; totals, %, grade and result follow from the batch components and pass mark
  async saveResults(batchId, entries, context) {
    const batch = await this.get(batchId);
    this.assertOpen(batch);
    if (!Array.isArray(entries) || entries.length === 0) throw new AppError("no results were sent");
    const candidates = new Map((await this.candidates(batch._id)).map((candidate) => [String(candidate._id), candidate]));
    const totalMax = batch.components.reduce((sum, component) => sum + component.max, 0);
    const updates = entries.map((entry, index) => {
      const candidate = candidates.get(String(entry.candidate));
      if (!candidate) throw new AppError(`row ${index + 1}: the candidate is not in this batch`);
      if (!["present", "absent"].includes(entry.attendance)) throw new AppError(`row ${index + 1}: attendance must be present or absent`);
      if (entry.attendance === "absent") return { candidate, set: { attendance: "absent", marks: {}, total: 0, percentage: 0, grade: "AB", result: "Absent" } };
      const marks = {};
      for (const component of batch.components) {
        const value = Number(entry.marks?.[component.key]);
        if (!Number.isFinite(value) || value < 0 || value > component.max) throw new AppError(`${candidate.name}: ${component.label} must be 0-${component.max}`);
        marks[component.key] = value;
      }
      const total = Object.values(marks).reduce((sum, value) => sum + value, 0);
      const percentage = Math.round((total / totalMax) * 1000) / 10;
      return { candidate, set: { attendance: "present", marks, total, percentage, grade: grade(percentage, batch.passPercent), result: percentage >= batch.passPercent ? "Pass" : "Fail" } };
    });
    await OfflineCandidate.bulkWrite(updates.map(({ candidate, set }) => ({ updateOne: { filter: { _id: candidate._id }, update: { $set: set } } })));
    const pending = await OfflineCandidate.countDocuments({ batch: batch._id, result: null });
    batch.status = pending === 0 ? "assessed" : "draft";
    await batch.save();
    await log(context, "offline_results_saved", "OfflineBatch", batch._id, { after: Object.fromEntries(updates.map(({ candidate, set }) => [candidate.enrollmentNumber, `${set.attendance} ${set.total} ${set.result}`])) });
    return { saved: updates.length, pending };
  }

  async resultTemplate(batchId) {
    const batch = await this.get(batchId);
    const candidates = await this.candidates(batch._id);
    return workbookBuffer(
      "Results",
      [
        { header: "Enrolment No.", key: "enrollmentNumber", width: 20 },
        { header: "Name", key: "name", width: 28 },
        { header: "Present (Y/N)", key: "present", width: 12 },
        ...batch.components.map((component) => ({ header: `${component.label} (max ${component.max})`, key: component.key, width: 16 })),
      ],
      candidates.map((candidate) => ({
        enrollmentNumber: candidate.enrollmentNumber,
        name: candidate.name,
        present: candidate.attendance === "absent" ? "N" : candidate.attendance === "present" ? "Y" : "",
        ...Object.fromEntries(batch.components.map((component) => [component.key, candidate.marks?.get(component.key) ?? ""])),
      })),
      { title: `Results – ${batch.batchCode} · ${batch.jobRole} (do not change the Enrolment No. column)` }
    );
  }

  async importResults(batchId, buffer, context) {
    const batch = await this.get(batchId);
    this.assertOpen(batch);
    if (!buffer) throw new AppError("upload the filled results template");
    let rows;
    try {
      rows = await readSheet(buffer, "Enrolment No.");
    } catch {
      throw new AppError("the file is not a valid Excel (.xlsx) workbook");
    }
    const byEnrolment = new Map((await this.candidates(batch._id)).map((candidate) => [candidate.enrollmentNumber, String(candidate._id)]));
    const errors = [];
    const entries = [];
    rows.forEach((row, index) => {
      const enrolment = String(row["Enrolment No."] ?? "").trim();
      if (!enrolment) return;
      const candidate = byEnrolment.get(enrolment);
      if (!candidate) return errors.push(`row ${index + 1}: ${enrolment} is not in batch ${batch.batchCode}`);
      const present = String(row["Present (Y/N)"] ?? "").trim().toUpperCase();
      if (!["Y", "N"].includes(present)) return errors.push(`row ${index + 1}: Present must be Y or N for ${enrolment}`);
      entries.push({ candidate, attendance: present === "Y" ? "present" : "absent", marks: Object.fromEntries(batch.components.map((component) => [component.key, row[`${component.label} (max ${component.max})`]])) });
    });
    if (errors.length) throw new AppError(`the file has errors, nothing was saved: ${errors.slice(0, 15).join("; ")}`);
    if (!entries.length) throw new AppError("no result rows found; use the downloaded template");
    return this.saveResults(batch._id, entries, context);
  }
}

export default OfflineBatchService;
