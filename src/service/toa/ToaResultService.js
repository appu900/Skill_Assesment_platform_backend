import crypto from "crypto";
import mongoose from "mongoose";
import ToaResult from "../../models/toa/ToaResult.model.js";
import ToaCertificate from "../../models/toa/ToaCertificate.model.js";
import ToaInvoice from "../../models/toa/ToaInvoice.model.js";
import ToaTrainee from "../../models/toa/ToaTrainee.model.js";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import ToaAttendanceService from "./ToaAttendanceService.js";
import { notify } from "./ToaNotificationService.js";
import { day } from "./ToaInvoiceService.js";
import serverConfig from "../../config/serverConfig.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { audit } from "../../utils/audit.js";
import { nextNumber, pad, rosterIds } from "../../utils/toa/sequence.js";
import { toaSettings } from "../../utils/toa/settings.js";
import { qrDataUrl, renderPdf } from "../../utils/toa/render.js";
import { readSheet, workbookBuffer } from "../../utils/toa/excel.js";

const verifyUrl = (code) => `${serverConfig.FRONTEND_URL}/verify/toa/${code}`;

class ToaResultService {
  constructor() {
    this.attendance = new ToaAttendanceService();
  }

  assertResultsOpen(batch) {
    if (!["approved", "completed"].includes(batch.status)) throw new AppError("results can be entered only for batches approved by CUTM");
    if (batch.resultsStatus === "published") throw new AppError("results of this batch are published; use certificate correction instead");
  }

  // ** everything CUTM needs to decide: attendance %, payment, result, certificate and the eligibility it implies
  async grid(batch) {
    await batch.populate("trainees.trainee", "name registrationId");
    const settings = await toaSettings(batch.toaTpId);
    const { approvedSessions, percentOf } = await this.attendance.percentages(batch);
    const [results, certificates, invoice] = await Promise.all([
      ToaResult.find({ batch: batch._id }).lean(),
      ToaCertificate.find({ batch: batch._id }).sort({ createdAt: -1 }).lean(),
      ToaInvoice.findOne({ batch: batch._id }).select("status invoiceNumber total").lean(),
    ]);
    const resultOf = new Map(results.map((row) => [String(row.trainee), row]));
    const paid = invoice?.status === "paid";
    const allSessionsApproved = batch.sessions.length > 0 && batch.sessions.every((session) => session.attendanceStatus === "approved");
    const rows = batch.trainees.map(({ trainee }) => {
      const result = resultOf.get(String(trainee._id)) ?? null;
      const percent = Math.round(percentOf(trainee._id) * 10) / 10;
      const blockers = [];
      if (!allSessionsApproved) blockers.push("attendance of every session must be approved");
      else if (percent < settings.minAttendancePercent) blockers.push(`attendance ${percent}% is below ${settings.minAttendancePercent}%`);
      if (settings.paymentRequiredForCertificate && !paid) blockers.push("batch fee not paid");
      if (!result) blockers.push("no result entered");
      else if (result.result !== "Pass") blockers.push(`result is ${result.result}`);
      return {
        trainee: { _id: trainee._id, name: trainee.name, registrationId: trainee.registrationId },
        attendancePercent: approvedSessions ? percent : null,
        result,
        // ** the valid certificate, else the latest one (revoked / replaced) so its history stays visible
        certificate: certificates.find((cert) => String(cert.trainee) === String(trainee._id) && cert.status === "valid") ?? certificates.find((cert) => String(cert.trainee) === String(trainee._id)) ?? null,
        eligible: blockers.length === 0,
        blockers,
      };
    });
    return {
      batch: { _id: batch._id, batchCode: batch.batchCode, programmeName: batch.programmeName, status: batch.status, resultsStatus: batch.resultsStatus },
      settings: { passMark: settings.passMark, minAttendancePercent: settings.minAttendancePercent, paymentRequiredForCertificate: settings.paymentRequiredForCertificate },
      invoice,
      allSessionsApproved,
      rows,
    };
  }

  // ** draft results; Pass/Fail follows the pass mark, "absent" overrides it
  async save(batch, entries, adminId, context) {
    this.assertResultsOpen(batch);
    if (!Array.isArray(entries) || entries.length === 0) throw new AppError("no results were sent");
    const roster = new Set(rosterIds(batch));
    const { passMark } = await toaSettings(batch.toaTpId);
    const clean = entries.map((entry, index) => {
      if (!roster.has(String(entry.trainee))) throw new AppError(`row ${index + 1}: the assessor is not in this batch`);
      const absent = entry.absent === true;
      const score = absent ? 0 : Number(entry.score);
      if (!absent && (!Number.isFinite(score) || score < 0 || score > 100)) throw new AppError(`row ${index + 1}: score must be 0-100`);
      return { trainee: String(entry.trainee), score: Math.round(score * 100) / 100, result: absent ? "Absent" : score >= passMark ? "Pass" : "Fail", remarks: String(entry.remarks ?? "").trim().slice(0, 300) || null };
    });
    if (new Set(clean.map((entry) => entry.trainee)).size !== clean.length) throw new AppError("the same assessor appears twice");
    const previous = new Map((await ToaResult.find({ batch: batch._id, trainee: { $in: clean.map((entry) => entry.trainee) } }).lean()).map((row) => [String(row.trainee), row]));
    await ToaResult.bulkWrite(
      clean.map((entry) => ({
        updateOne: {
          filter: { batch: batch._id, trainee: entry.trainee },
          update: { $set: { ...entry, toaTpId: batch.toaTpId, status: "draft", enteredBy: adminId, approvedBy: null, approvedAt: null } },
          upsert: true,
        },
      }))
    );
    // ** any change after approval needs a fresh approval
    if (batch.resultsStatus !== "draft") {
      batch.resultsStatus = "draft";
      batch.resultsApprovedAt = null;
      await ToaResult.updateMany({ batch: batch._id }, { status: "draft", approvedBy: null, approvedAt: null });
      await batch.save();
    }
    await audit(context, {
      module: "toa",
      entity: "ToaBatch",
      entityId: batch._id,
      action: "results_entered",
      before: Object.fromEntries(clean.filter((entry) => previous.has(entry.trainee)).map((entry) => [entry.trainee, `${previous.get(entry.trainee).score} ${previous.get(entry.trainee).result}`])),
      after: Object.fromEntries(clean.map((entry) => [entry.trainee, `${entry.score} ${entry.result}`])),
    });
    return this.grid(batch);
  }

  // ** the controlled template: one row per assessor of the batch, pre-filled with ids and names
  async templateXlsx(batch) {
    await batch.populate("trainees.trainee", "name registrationId");
    const existing = new Map((await ToaResult.find({ batch: batch._id }).lean()).map((row) => [String(row.trainee), row]));
    return workbookBuffer(
      "Results",
      [
        { header: "Registration ID", key: "registrationId", width: 22 },
        { header: "Name", key: "name", width: 28 },
        { header: "Score (0-100)", key: "score", width: 14 },
        { header: "Absent (Y/N)", key: "absent", width: 12 },
        { header: "Remarks", key: "remarks", width: 40 },
      ],
      batch.trainees.map(({ trainee }) => {
        const row = existing.get(String(trainee._id));
        return { registrationId: trainee.registrationId, name: trainee.name, score: row && row.result !== "Absent" ? row.score : "", absent: row?.result === "Absent" ? "Y" : "", remarks: row?.remarks ?? "" };
      }),
      { title: `Results – ${batch.batchCode} · ${batch.programmeName} (do not change the Registration ID column)` }
    );
  }

  // ** all rows are validated first; nothing is saved when any row is wrong
  async importXlsx(batch, buffer, adminId, context) {
    this.assertResultsOpen(batch);
    if (!buffer) throw new AppError("upload the filled results template");
    let rows;
    try {
      rows = await readSheet(buffer);
    } catch {
      throw new AppError("the file is not a valid Excel (.xlsx) workbook");
    }
    if (!rows.length) throw new AppError("no result rows found; use the downloaded template");
    await batch.populate("trainees.trainee", "registrationId");
    const byRegistration = new Map(batch.trainees.map(({ trainee }) => [String(trainee.registrationId), String(trainee._id)]));
    const errors = [];
    const entries = [];
    rows.forEach((row, index) => {
      const line = index + 1;
      const registrationId = String(row["Registration ID"] ?? "").trim();
      if (!registrationId) return;
      const trainee = byRegistration.get(registrationId);
      if (!trainee) return errors.push(`row ${line}: ${registrationId} is not in batch ${batch.batchCode}`);
      const absent = String(row["Absent (Y/N)"] ?? "").trim().toUpperCase() === "Y";
      const rawScore = row["Score (0-100)"];
      if (!absent && (rawScore === undefined || rawScore === null || rawScore === "")) return errors.push(`row ${line}: score is missing for ${registrationId}`);
      const score = Number(rawScore);
      if (!absent && (!Number.isFinite(score) || score < 0 || score > 100)) return errors.push(`row ${line}: score of ${registrationId} must be 0-100`);
      entries.push({ trainee, score, absent, remarks: row.Remarks });
    });
    if (errors.length) throw new AppError(`the file has errors, nothing was saved: ${errors.slice(0, 15).join("; ")}`);
    if (!entries.length) throw new AppError("no result rows found; use the downloaded template");
    return this.save(batch, entries, adminId, context);
  }

  async approve(batch, adminId, context) {
    this.assertResultsOpen(batch);
    const count = await ToaResult.countDocuments({ batch: batch._id, trainee: { $in: rosterIds(batch) } });
    if (count < batch.trainees.length) throw new AppError(`results are missing for ${batch.trainees.length - count} assessor(s)`);
    await ToaResult.updateMany({ batch: batch._id }, { status: "approved", approvedBy: adminId, approvedAt: new Date() });
    batch.resultsStatus = "approved";
    batch.resultsApprovedAt = new Date();
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "results_approved" });
    return this.grid(batch);
  }

  // ** publishes every result; certificates only for assessors who meet every configured eligibility rule
  async publish(batch, adminId, context) {
    if (batch.resultsStatus !== "approved") throw new AppError("approve the results before publishing them");
    const grid = await this.grid(batch);
    if (!grid.allSessionsApproved) throw new AppError("approve the attendance of every session before publishing");
    const tp = await ToaTrainingPartner.findById(batch.toaTpId).select("organizationName email").lean();
    const year = new Date().getFullYear();
    let issued = 0;
    for (const row of grid.rows) {
      const result = row.result;
      if (row.eligible) {
        const certificate = await ToaCertificate.create({
          certificateNumber: `CUTM/RT-TOA/${year}/${pad(await nextNumber(`toa_certificate_${year}`), 6)}`,
          verifyCode: crypto.randomBytes(12).toString("hex"),
          trainee: row.trainee._id,
          batch: batch._id,
          result: result._id,
          toaTpId: batch.toaTpId,
          snapshot: { name: row.trainee.name, registrationId: row.trainee.registrationId, programmeName: batch.programmeName, batchCode: batch.batchCode, trainingPartner: tp?.organizationName, startDate: batch.startDate, endDate: batch.endDate, score: result.score, result: result.result },
          issuedBy: adminId,
        });
        issued += 1;
        await audit(context, { module: "toa", entity: "ToaCertificate", entityId: certificate._id, action: "certificate_issued", after: { certificateNumber: certificate.certificateNumber, trainee: row.trainee.registrationId } });
      }
      const withheld = result.result === "Pass" && !row.eligible ? row.blockers.join("; ") : null;
      await ToaResult.updateOne({ _id: result._id }, { status: withheld ? "withheld" : "published", withheldReason: withheld, publishedAt: new Date() });
    }
    batch.resultsStatus = "published";
    batch.resultsPublishedAt = new Date();
    batch.status = "completed";
    batch.history.push({ status: "completed", remarks: `results published, ${issued} certificate(s) issued`, byRole: ROLES.ADMIN, by: adminId });
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "results_published", after: { certificates: issued, assessors: grid.rows.length } });

    await notify({ role: ROLES.TOA_TRAINING_PARTNER, id: batch.toaTpId, email: tp?.email, title: `Results of ${batch.batchCode} published`, message: `CUTM published the results of batch ${batch.batchCode}: ${issued} of ${grid.rows.length} assessors received a certificate.`, link: `/toa/batches/${batch._id}` });
    const trainees = await ToaTrainee.find({ _id: { $in: grid.rows.map((row) => row.trainee._id) } }).select("email portalEnabled").lean();
    for (const trainee of trainees) {
      const row = grid.rows.find((item) => String(item.trainee._id) === String(trainee._id));
      await notify({
        role: ROLES.TOA_ASSESSOR,
        id: trainee._id,
        email: trainee.email,
        title: "Your RailTel ToA result is published",
        message: row.eligible ? `Congratulations, you have passed ${batch.programmeName}. Your certificate is ready to download.` : `Your result for ${batch.programmeName} is published: ${row.result?.result ?? "not available"}.`,
        link: trainee.portalEnabled ? "/toa-assessor" : null,
      });
    }
    return { issued, assessors: grid.rows.length };
  }

  // ---------------------------------------------------------------- certificates

  async certificate(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const certificate = await ToaCertificate.findById(id);
    if (!certificate) throw AppError.notFound("certificate not found");
    return certificate;
  }

  async certificatePdf(certificate) {
    if (certificate.status !== "valid") throw new AppError(`this certificate is ${certificate.status} and cannot be downloaded`);
    const snapshot = certificate.snapshot;
    return renderPdf(
      "certificate",
      {
        ...snapshot,
        certificateNumber: certificate.certificateNumber,
        issueDate: day(certificate.issueDate),
        startDate: day(snapshot.startDate),
        endDate: day(snapshot.endDate),
        qrCode: await qrDataUrl(verifyUrl(certificate.verifyCode)),
        verifyUrl: verifyUrl(certificate.verifyCode).replace(/^https?:\/\//, ""),
      },
      { landscape: true, toaTpId: certificate.toaTpId }
    );
  }

  async revoke(id, reason, context) {
    const certificate = await this.certificate(id);
    if (certificate.status !== "valid") throw new AppError(`this certificate is already ${certificate.status}`);
    if (!String(reason ?? "").trim()) throw new AppError("Please give a reason");
    certificate.status = "revoked";
    certificate.statusReason = String(reason).trim().slice(0, 500);
    await certificate.save();
    await audit(context, { module: "toa", entity: "ToaCertificate", entityId: certificate._id, action: "certificate_revoked", note: certificate.statusReason });
    return certificate;
  }

  // ** a corrected copy with a new number; the old one stays verifiable as "reissued"
  async reissue(id, { reason, name }, adminId, context) {
    const old = await this.certificate(id);
    if (old.status !== "valid") throw new AppError("only a valid certificate can be reissued");
    if (!String(reason ?? "").trim()) throw new AppError("Please give a reason");
    const year = new Date().getFullYear();
    const snapshot = { ...old.snapshot.toObject(), ...(String(name ?? "").trim() ? { name: String(name).trim() } : {}) };
    const replacement = await ToaCertificate.create({
      certificateNumber: `CUTM/RT-TOA/${year}/${pad(await nextNumber(`toa_certificate_${year}`), 6)}`,
      verifyCode: crypto.randomBytes(12).toString("hex"),
      trainee: old.trainee,
      batch: old.batch,
      result: old.result,
      toaTpId: old.toaTpId,
      snapshot,
      issuedBy: adminId,
      replaces: old._id,
    });
    old.status = "reissued";
    old.statusReason = String(reason).trim().slice(0, 500);
    old.replacedBy = replacement._id;
    await old.save();
    await audit(context, { module: "toa", entity: "ToaCertificate", entityId: replacement._id, action: "certificate_reissued", before: { certificateNumber: old.certificateNumber, name: old.snapshot.name }, after: { certificateNumber: replacement.certificateNumber, name: snapshot.name }, note: old.statusReason });
    return replacement;
  }

  // ** public: what the QR code / verification page shows
  async verify(code) {
    const certificate = await ToaCertificate.findOne({ $or: [{ verifyCode: String(code ?? "") }, { certificateNumber: String(code ?? "") }] }).populate("replacedBy", "certificateNumber").lean();
    if (!certificate) throw AppError.notFound("no certificate matches this code");
    const { snapshot } = certificate;
    return {
      certificateNumber: certificate.certificateNumber,
      status: certificate.status,
      statusReason: certificate.status === "valid" ? null : certificate.statusReason,
      replacedBy: certificate.replacedBy?.certificateNumber ?? null,
      name: snapshot.name,
      registrationId: snapshot.registrationId,
      programmeName: snapshot.programmeName,
      batchCode: snapshot.batchCode,
      trainingPartner: snapshot.trainingPartner,
      startDate: snapshot.startDate,
      endDate: snapshot.endDate,
      result: snapshot.result,
      issueDate: certificate.issueDate,
    };
  }

  async listCertificates(filter = {}) {
    return ToaCertificate.find(filter).sort({ createdAt: -1 }).populate("replacedBy", "certificateNumber").lean();
  }
}

export default ToaResultService;
