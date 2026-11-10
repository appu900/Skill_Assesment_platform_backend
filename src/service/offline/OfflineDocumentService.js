import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";
import OfflineTemplate, { OFFLINE_TEMPLATE_TYPES } from "../../models/offline/OfflineTemplate.model.js";
import OfflineCertificate from "../../models/offline/OfflineCertificate.model.js";
import OfflineCandidate from "../../models/offline/OfflineCandidate.model.js";
import OfflineTrainingPartner from "../../models/offline/OfflineTrainingPartner.model.js";
import OfflineBatchService from "./OfflineBatchService.js";
import serverConfig from "../../config/serverConfig.js";
import AppError from "../../utils/AppError.js";
import { audit } from "../../utils/audit.js";
import { nextNumber, pad } from "../../utils/toa/sequence.js";
import { fillTemplate, htmlToPdf, qrDataUrl } from "../../utils/toa/render.js";
import { imageDataUrl } from "../../utils/toa/storage.js";

const TEMPLATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../templates/offline");
const MAX_BYTES = 300 * 1024;
const day = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");
const verifyUrl = (code) => `${serverConfig.FRONTEND_URL}/verify/offline/${code}`;
const log = (context, action, entity, entityId, extra = {}) => audit(context, { module: "offline", action, entity, entityId, ...extra });
const builtIn = (type) => fs.readFileSync(path.join(TEMPLATE_DIR, `${type}.html`), "utf8");
const idOf = (value) => (value?._id ?? value ? String(value?._id ?? value) : null);

// ** where a template applies; both empty = the CUTM default for everyone
const LEVELS = [
  ["partner_scheme", (tp, scheme) => tp && scheme && { tp, scheme }],
  ["partner", (tp) => tp && { tp, scheme: null }],
  ["scheme", (tp, scheme) => scheme && { tp: null, scheme }],
  ["default", () => ({ tp: null, scheme: null })],
];

class OfflineDocumentService {
  constructor() {
    this.batches = new OfflineBatchService();
  }

  // ---------------------------------------------------------------- templates

  assertType(type) {
    if (!OFFLINE_TEMPLATE_TYPES.includes(type)) throw new AppError(`template must be one of ${OFFLINE_TEMPLATE_TYPES.join(", ")}`);
  }

  async scope({ tp, scheme } = {}) {
    const tpId = tp && tp !== "any" ? tp : null;
    if (tpId && (!mongoose.isValidObjectId(tpId) || !(await OfflineTrainingPartner.exists({ _id: tpId })))) throw AppError.notFound("training partner not found");
    return { tp: tpId ? String(tpId) : null, scheme: scheme && scheme !== "any" ? String(scheme).trim() : null };
  }

  // ** the most specific template for this partner and scheme, and which level it came from
  async resolve(type, tp, scheme) {
    const tpId = idOf(tp);
    const candidates = await OfflineTemplate.find({ type, tp: { $in: [tpId, null].filter((value, index) => value || index === 1) }, scheme: { $in: [scheme ?? null, null] } }).lean();
    for (const [level, match] of LEVELS) {
      const where = match(tpId, scheme ?? null);
      if (!where) continue;
      const found = candidates.find((row) => idOf(row.tp) === where.tp && (row.scheme ?? null) === where.scheme);
      if (found) return { html: found.html, source: level, version: found.version };
    }
    return { html: builtIn(type), source: "built-in", version: 0 };
  }

  async listTemplates(query) {
    const { tp, scheme } = await this.scope(query);
    return Promise.all(
      OFFLINE_TEMPLATE_TYPES.map(async (type) => {
        const own = await OfflineTemplate.findOne({ type, tp, scheme }).lean();
        const used = await this.resolve(type, tp, scheme);
        return { type, custom: Boolean(own), version: own?.version ?? 0, source: used.source, html: used.html };
      })
    );
  }

  // ** every saved template with its scope, for the overview
  async savedTemplates() {
    return OfflineTemplate.find().select("type tp scheme version updatedAt").populate("tp", "organizationName tpCode").sort({ type: 1 }).lean();
  }

  validate(html) {
    const value = String(html ?? "");
    if (!value.trim()) throw new AppError("the template is empty");
    if (Buffer.byteLength(value) > MAX_BYTES) throw new AppError("the template is larger than 300 KB; embed smaller images");
    if (/<script|javascript:|on\w+\s*=/i.test(value)) throw new AppError("templates cannot contain scripts or event handlers");
    return value;
  }

  async saveTemplate(type, query, html, adminId, context) {
    this.assertType(type);
    const where = await this.scope(query);
    const saved = await OfflineTemplate.findOneAndUpdate({ type, ...where }, { $set: { html: this.validate(html), updatedBy: adminId }, $inc: { version: 1 } }, { upsert: true, new: true });
    await log(context, "offline_template_saved", "OfflineTemplate", saved._id, { note: `${type} v${saved.version} · partner ${where.tp ?? "any"} · scheme ${where.scheme ?? "any"}` });
    return saved;
  }

  async resetTemplate(type, query, context) {
    this.assertType(type);
    const where = await this.scope(query);
    await OfflineTemplate.deleteOne({ type, ...where });
    await log(context, "offline_template_reset", "OfflineTemplate", null, { note: `${type} · partner ${where.tp ?? "any"} · scheme ${where.scheme ?? "any"}` });
    return true;
  }

  async previewTemplate(type, query, html) {
    this.assertType(type);
    const { tp, scheme } = await this.scope(query);
    const value = html ? this.validate(html) : (await this.resolve(type, tp, scheme)).html;
    return htmlToPdf(fillTemplate(value, await this.sample()));
  }

  async sample() {
    const components = [{ label: "Theory", max: 50 }, { label: "Practical", max: 50 }];
    return {
      ...this.batchFields({ batchCode: "OFF-B-2026-0007", externalBatchId: "AB/2026/117", scheme: "PMKVY 4.0", jobRole: "Field Technician – Computing", qpCode: "ELE/Q4601", nsqfLevel: "4", sector: "Electronics", centreName: "Skill Centre Cuttack", district: "Cuttack", state: "Odisha", startDate: "2026-09-01", endDate: "2026-10-15", assessmentDate: "2026-10-20", passPercent: 50, components }, { organizationName: "Sample Skills Pvt Ltd", tpCode: "OFF-TP-0001" }, { name: "R. Mohanty", assessorCode: "CUTM-AS-0003" }),
      name: "Priya Nayak",
      fatherName: "Suresh Nayak",
      enrollmentNumber: "OFF-C-2026-00042",
      certificateNumber: "CUTM/OFF/2026/000042",
      issueDate: day(new Date()),
      grade: "A",
      percentage: 88,
      result: "Pass",
      qrCode: await qrDataUrl("https://example.org/verify/offline/sample"),
      verifyUrl: "example.org/verify/offline/sample",
      rows: [
        { enrollmentNumber: "OFF-C-2026-00042", candidateId: "C-17", name: "Priya Nayak", fatherName: "Suresh Nayak", attendance: "Present", marks: [{ value: 44 }, { value: 44 }], total: 88, percentage: 88, grade: "A", result: "Pass" },
        { enrollmentNumber: "OFF-C-2026-00043", candidateId: "C-18", name: "Arjun Das", fatherName: "Mohan Das", attendance: "Absent", marks: [{ value: "AB" }, { value: "AB" }], total: "AB", percentage: "", grade: "AB", result: "Absent" },
      ],
      count: 2,
      present: 1,
      passed: 1,
      failed: 0,
      absent: 1,
      photo: "",
      mobile: "9876543210",
      qualification: "B.Tech, 8 years",
      sectors: "Electronics, IT-ITeS",
      bloodGroup: "O+",
      validTill: "31 Dec 2027",
    };
  }

  // ---------------------------------------------------------------- documents

  batchFields(batch, tp, assessor) {
    return {
      batchCode: batch.batchCode,
      externalBatchId: batch.externalBatchId ?? "",
      scheme: batch.scheme ?? "",
      jobRole: batch.jobRole,
      qpCode: batch.qpCode ?? "",
      nsqfLevel: batch.nsqfLevel ?? "",
      sector: batch.sector ?? "",
      centreName: batch.centreName ?? "",
      district: batch.district ?? "",
      state: batch.state ?? "",
      startDate: day(batch.startDate),
      endDate: day(batch.endDate),
      assessmentDate: day(batch.assessmentDate),
      passPercent: batch.passPercent,
      trainingPartner: tp?.organizationName ?? "",
      tpCode: tp?.tpCode ?? "",
      assessorName: assessor?.name ?? "",
      assessorCode: assessor?.assessorCode ?? "",
      components: batch.components.map((component) => ({ label: component.label, max: component.max })),
      totalMax: batch.components.reduce((sum, component) => sum + component.max, 0),
    };
  }

  async render(type, batch, data, options) {
    const { html } = await this.resolve(type, batch.tp, batch.scheme);
    return htmlToPdf(fillTemplate(html, data), options);
  }

  async sheetData(batch) {
    const candidates = await this.batches.candidates(batch._id);
    const rows = candidates.map((candidate) => ({
      enrollmentNumber: candidate.enrollmentNumber,
      candidateId: candidate.candidateId ?? "",
      name: candidate.name,
      fatherName: candidate.fatherName ?? "",
      attendance: candidate.attendance === "present" ? "Present" : candidate.attendance === "absent" ? "Absent" : "",
      marks: batch.components.map((component) => ({ value: candidate.attendance === "absent" ? "AB" : candidate.marks?.get(component.key) ?? "" })),
      total: candidate.attendance === "absent" ? "AB" : candidate.total ?? "",
      percentage: candidate.attendance === "absent" ? "" : candidate.percentage ?? "",
      grade: candidate.grade ?? "",
      result: candidate.result ?? "",
    }));
    return {
      ...this.batchFields(batch, batch.tp, batch.assessor),
      rows,
      count: rows.length,
      present: candidates.filter((candidate) => candidate.attendance === "present").length,
      passed: candidates.filter((candidate) => candidate.result === "Pass").length,
      failed: candidates.filter((candidate) => candidate.result === "Fail").length,
      absent: candidates.filter((candidate) => candidate.result === "Absent").length,
    };
  }

  async attendanceSheet(batchId) {
    const batch = await this.batches.get(batchId);
    return { batch, pdf: await this.render("attendance_sheet", batch, await this.sheetData(batch)) };
  }

  async resultSheet(batchId) {
    const batch = await this.batches.get(batchId);
    const data = await this.sheetData(batch);
    if (data.rows.some((row) => !row.result)) throw new AppError("enter the attendance and marks of every candidate first");
    return { batch, pdf: await this.render("result_sheet", batch, data) };
  }

  async idCard(assessor) {
    const { html } = await this.resolve("id_card", null, null);
    return htmlToPdf(
      fillTemplate(html, {
        name: assessor.name,
        assessorCode: assessor.assessorCode,
        photo: await imageDataUrl(assessor.photoKey),
        mobile: assessor.mobile,
        qualification: [assessor.qualification, assessor.experienceYears ? `${assessor.experienceYears} years` : ""].filter(Boolean).join(", "),
        sectors: (assessor.sectors ?? []).join(", "),
        bloodGroup: assessor.bloodGroup ?? "",
        validTill: day(assessor.validTill),
        issueDate: day(new Date()),
      })
    );
  }

  // ** certificates for every candidate who passed; the batch is locked afterwards
  async publish(batchId, adminId, context) {
    const batch = await this.batches.get(batchId);
    if (batch.status === "published") throw new AppError("this batch is already published");
    const candidates = await this.batches.candidates(batch._id);
    if (!candidates.length) throw new AppError("the batch has no candidates");
    if (candidates.some((candidate) => !candidate.result)) throw new AppError("enter the attendance and marks of every candidate first");
    if (!batch.assessor || !batch.assessmentDate) throw new AppError("set the assessor and the assessment date first");
    const fields = this.batchFields(batch, batch.tp, batch.assessor);
    const year = new Date().getFullYear();
    let issued = 0;
    for (const candidate of candidates.filter((item) => item.result === "Pass")) {
      if (await OfflineCertificate.exists({ candidate: candidate._id, status: "valid" })) continue;
      const certificate = await OfflineCertificate.create({
        certificateNumber: `CUTM/OFF/${year}/${pad(await nextNumber(`offline_certificate_${year}`), 6)}`,
        verifyCode: crypto.randomBytes(12).toString("hex"),
        candidate: candidate._id,
        batch: batch._id,
        tp: batch.tp._id,
        snapshot: { ...fields, name: candidate.name, fatherName: candidate.fatherName ?? "", enrollmentNumber: candidate.enrollmentNumber, candidateId: candidate.candidateId ?? "", grade: candidate.grade, percentage: candidate.percentage, result: candidate.result },
      });
      issued += 1;
      await log(context, "offline_certificate_issued", "OfflineCertificate", certificate._id, { after: { certificateNumber: certificate.certificateNumber, candidate: candidate.enrollmentNumber } });
    }
    batch.status = "published";
    batch.publishedAt = new Date();
    await batch.save();
    await log(context, "offline_batch_published", "OfflineBatch", batch._id, { after: { certificates: issued, candidates: candidates.length } });
    return { issued, candidates: candidates.length };
  }

  async certificatePdf(certificate) {
    if (certificate.status !== "valid") throw new AppError("this certificate is revoked");
    const batch = await this.batches.get(certificate.batch);
    return this.render("certificate", batch, { ...certificate.snapshot, certificateNumber: certificate.certificateNumber, issueDate: day(certificate.issueDate), qrCode: await qrDataUrl(verifyUrl(certificate.verifyCode)), verifyUrl: verifyUrl(certificate.verifyCode).replace(/^https?:\/\//, "") });
  }

  // ** every valid certificate of the batch in one PDF, ready to print
  async allCertificatesPdf(batchId) {
    const batch = await this.batches.get(batchId);
    const certificates = await OfflineCertificate.find({ batch: batch._id, status: "valid" }).sort({ certificateNumber: 1 });
    if (!certificates.length) throw new AppError("no certificates are issued for this batch");
    const merged = await PDFDocument.create();
    for (const certificate of certificates) {
      const single = await PDFDocument.load(await this.certificatePdf(certificate));
      for (const page of await merged.copyPages(single, single.getPageIndices())) merged.addPage(page);
    }
    return { batch, pdf: Buffer.from(await merged.save()) };
  }

  async certificate(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const certificate = await OfflineCertificate.findById(id);
    if (!certificate) throw AppError.notFound("certificate not found");
    return certificate;
  }

  async certificates(batchId) {
    return OfflineCertificate.find({ batch: batchId }).sort({ certificateNumber: 1 }).lean();
  }

  async revoke(id, reason, context) {
    const certificate = await this.certificate(id);
    if (certificate.status !== "valid") throw new AppError("this certificate is already revoked");
    if (!String(reason ?? "").trim()) throw new AppError("Please give a reason");
    certificate.status = "revoked";
    certificate.statusReason = String(reason).trim().slice(0, 500);
    await certificate.save();
    await log(context, "offline_certificate_revoked", "OfflineCertificate", certificate._id, { note: certificate.statusReason });
    return certificate;
  }

  async verify(code) {
    const certificate = await OfflineCertificate.findOne({ $or: [{ verifyCode: String(code ?? "") }, { certificateNumber: String(code ?? "") }] }).lean();
    if (!certificate) throw AppError.notFound("no certificate matches this code");
    const { snapshot } = certificate;
    return {
      certificateNumber: certificate.certificateNumber,
      status: certificate.status,
      statusReason: certificate.status === "valid" ? null : certificate.statusReason,
      name: snapshot.name,
      enrollmentNumber: snapshot.enrollmentNumber,
      jobRole: snapshot.jobRole,
      scheme: snapshot.scheme,
      trainingPartner: snapshot.trainingPartner,
      centreName: snapshot.centreName,
      grade: snapshot.grade,
      assessmentDate: snapshot.assessmentDate,
      issueDate: certificate.issueDate,
    };
  }
}

export default OfflineDocumentService;
