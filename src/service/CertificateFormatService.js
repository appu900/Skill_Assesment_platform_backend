import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";
import CertificateTemplate from "../models/CertificateTemplate.model.js";
import StudentCertificate from "../models/Certificate.js";
import Batch from "../models/Batch.model.js";
import TrainingPartner from "../models/TrainingPartner.model.js";
import serverConfig from "../config/serverConfig.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { audit } from "../utils/audit.js";
import { isSameId } from "../utils/ownership.js";
import { fillTemplate, htmlToPdf, qrDataUrl } from "../utils/toa/render.js";
import logger from "../utils/logger.js";

const BUILT_IN = path.join(path.dirname(fileURLToPath(import.meta.url)), "../templates/core/certificate.html");
const MAX_BYTES = 300 * 1024;
const day = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const idOf = (value) => (value?._id ?? value ? String(value?._id ?? value) : null);
const log = (context, action, entityId, note) => audit(context, { module: "core", action, entity: "CertificateTemplate", entityId, note });

// ** most specific first; both empty = the CUTM default for every partner
const LEVELS = [
  ["partner_scheme", (tp, scheme) => tp && scheme && { tp, scheme }],
  ["partner", (tp) => tp && { tp, scheme: null }],
  ["scheme", (tp, scheme) => scheme && { tp: null, scheme }],
  ["default", () => ({ tp: null, scheme: null })],
];

// ** pictures stored at public urls (scheme logo, candidate photo) embedded as data: urls, since the PDF renderer loads nothing from the network
async function embed(url) {
  if (!url || !/^https?:\/\//.test(url)) return "";
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) return "";
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 2 * 1024 * 1024 ? "" : `data:${type};base64,${bytes.toString("base64")}`;
  } catch (error) {
    logger.warn(`certificate image not embedded: ${error.message}`);
    return "";
  }
}

// ** printable certificates of the normal TP flow, in each partner's / scheme's format
class CertificateFormatService {
  // ---------------------------------------------------------------- formats

  async scope({ tp, scheme } = {}) {
    const tpId = tp && tp !== "any" ? tp : null;
    if (tpId && (!mongoose.isValidObjectId(tpId) || !(await TrainingPartner.exists({ _id: tpId })))) throw AppError.notFound("training partner not found");
    return { tp: tpId ? String(tpId) : null, scheme: scheme && scheme !== "any" ? String(scheme).trim() : null };
  }

  async resolve(tp, scheme) {
    const tpId = idOf(tp);
    const rows = await CertificateTemplate.find({ tp: { $in: tpId ? [tpId, null] : [null] }, scheme: { $in: [scheme ?? null, null] } }).lean();
    for (const [level, match] of LEVELS) {
      const where = match(tpId, scheme ?? null);
      const found = where && rows.find((row) => idOf(row.tp) === where.tp && (row.scheme ?? null) === where.scheme);
      if (found) return { html: found.html, source: level, version: found.version };
    }
    return { html: fs.readFileSync(BUILT_IN, "utf8"), source: "built-in", version: 0 };
  }

  async get(query) {
    const { tp, scheme } = await this.scope(query);
    const own = await CertificateTemplate.findOne({ tp, scheme }).lean();
    const used = await this.resolve(tp, scheme);
    return { custom: Boolean(own), version: own?.version ?? 0, source: used.source, html: used.html };
  }

  async saved() {
    return CertificateTemplate.find().select("tp scheme version updatedAt").populate("tp", "organizationName tpCode").sort({ updatedAt: -1 }).lean();
  }

  validate(html) {
    const value = String(html ?? "");
    if (!value.trim()) throw new AppError("the format is empty");
    if (Buffer.byteLength(value) > MAX_BYTES) throw new AppError("the format is larger than 300 KB; embed smaller images");
    if (/<script|javascript:|on\w+\s*=/i.test(value)) throw new AppError("formats cannot contain scripts or event handlers");
    return value;
  }

  async save(query, html, adminId, context) {
    const where = await this.scope(query);
    const saved = await CertificateTemplate.findOneAndUpdate(where, { $set: { html: this.validate(html), updatedBy: adminId }, $inc: { version: 1 } }, { upsert: true, new: true });
    await log(context, "certificate_format_saved", saved._id, `v${saved.version} · partner ${where.tp ?? "any"} · scheme ${where.scheme ?? "any"}`);
    return saved;
  }

  async reset(query, context) {
    const where = await this.scope(query);
    await CertificateTemplate.deleteOne(where);
    await log(context, "certificate_format_removed", null, `partner ${where.tp ?? "any"} · scheme ${where.scheme ?? "any"}`);
    return true;
  }

  async preview(query, html) {
    const { tp, scheme } = await this.scope(query);
    const value = html ? this.validate(html) : (await this.resolve(tp, scheme)).html;
    return htmlToPdf(
      fillTemplate(value, {
        studentName: "Priya Nayak",
        fatherName: "Suresh Nayak",
        dob: "12 Mar 2003",
        enrollmentNumber: "OD2026000184",
        registrationNo: "REG-17",
        qualification: "Two Wheeler Service Technician",
        level: "4",
        credit: "18",
        duration: "390",
        trainingCentre: "Skill Centre Cuttack",
        district: "Cuttack",
        state: "Odisha",
        grade: "A",
        scheme: scheme ?? "PMKVY 4.0",
        schemeType: "Central Government",
        schemeLogo: "",
        photo: "",
        placeOfIssue: "Bhubaneswar",
        issueDate: day(new Date()),
        certificateNumber: "CUTM2026111842",
        trainingPartner: "Sample Skills Pvt Ltd",
        tpCode: "TP42",
        batchCode: "ODTP4220012",
        qrCode: await qrDataUrl(`${serverConfig.FRONTEND_URL}/verify?enrollment=OD2026000184`),
        verifyUrl: `${serverConfig.FRONTEND_URL.replace(/^https?:\/\//, "")}/verify`,
      })
    );
  }

  // ---------------------------------------------------------------- certificates

  // ** admin: any; training partner: its own batches; SNA: its scheme + state; LC/RC: corporate batches
  assertCanRead(batch, user) {
    const role = user?.role;
    if (role === ROLES.ADMIN) return;
    if (role === ROLES.TRAINING_PARTNER && isSameId(batch.trainingOrganizationId, user.id)) return;
    if (role === ROLES.SNA && batch.scheme === user.scheme && batch.state === user.state) return;
    if (role === ROLES.LCRC && batch.schemeType === "Corporate") return;
    throw AppError.forbidden("You cannot download certificates of this batch");
  }

  async batchOf(batchId) {
    if (!mongoose.isValidObjectId(batchId)) throw new AppError("invalid id");
    const batch = await Batch.findById(batchId).lean();
    if (!batch) throw AppError.notFound("batch not found");
    return batch;
  }

  async render(certificate, batch, tp, html) {
    const verify = `${serverConfig.FRONTEND_URL}/verify?enrollment=${encodeURIComponent(certificate.Enrolment_number)}`;
    return htmlToPdf(
      fillTemplate(html, {
        studentName: certificate.studentName,
        fatherName: certificate.fatherName,
        dob: day(certificate.DOB),
        enrollmentNumber: certificate.Enrolment_number,
        registrationNo: certificate.studentRedgNo ?? "",
        qualification: certificate.qualification,
        level: certificate.level,
        credit: certificate.credit,
        duration: certificate.duration,
        trainingCentre: certificate.TrainingCenter,
        district: certificate.District,
        state: certificate.state,
        grade: certificate.grade,
        scheme: batch.scheme ?? "",
        schemeType: certificate.schemeType ?? batch.schemeType ?? "",
        schemeLogo: await embed(certificate.schemeLogo),
        photo: await embed(certificate.stutentProfilePic),
        placeOfIssue: certificate.placeOfIssue,
        issueDate: day(certificate.DateOfIssue ?? certificate.createdAt),
        certificateNumber: certificate.certificateCode,
        trainingPartner: tp?.organizationName ?? batch.trainingOrganization ?? "",
        tpCode: tp?.tpCode ?? "",
        batchCode: batch.ABN_Number ?? "",
        qrCode: await qrDataUrl(verify),
        verifyUrl: verify.replace(/^https?:\/\//, ""),
      })
    );
  }

  async certificatePdf(certificateId, user) {
    if (!mongoose.isValidObjectId(certificateId)) throw new AppError("invalid id");
    const certificate = await StudentCertificate.findById(certificateId).lean();
    if (!certificate) throw AppError.notFound("certificate not found");
    const batch = await this.batchOf(certificate.batchId);
    this.assertCanRead(batch, user);
    const tp = await TrainingPartner.findById(batch.trainingOrganizationId).select("organizationName tpCode").lean();
    const { html } = await this.resolve(batch.trainingOrganizationId, batch.scheme);
    return { certificate, pdf: await this.render(certificate, batch, tp, html) };
  }

  // ** every certificate of a batch in one PDF, ready to print
  async batchPdf(batchId, user) {
    const batch = await this.batchOf(batchId);
    this.assertCanRead(batch, user);
    const certificates = await StudentCertificate.find({ batchId: String(batch._id) }).sort({ certificateCode: 1 }).lean();
    if (!certificates.length) throw new AppError("no certificates are issued for this batch yet");
    const tp = await TrainingPartner.findById(batch.trainingOrganizationId).select("organizationName tpCode").lean();
    const { html } = await this.resolve(batch.trainingOrganizationId, batch.scheme);
    const merged = await PDFDocument.create();
    for (const certificate of certificates) {
      const single = await PDFDocument.load(await this.render(certificate, batch, tp, html));
      for (const page of await merged.copyPages(single, single.getPageIndices())) merged.addPage(page);
    }
    return { batch, pdf: Buffer.from(await merged.save()) };
  }
}

export default CertificateFormatService;
