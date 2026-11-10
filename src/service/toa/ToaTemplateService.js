import mongoose from "mongoose";
import ToaTemplate, { TEMPLATE_TYPES } from "../../models/toa/ToaTemplate.model.js";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";
import { audit } from "../../utils/audit.js";
import { builtInTemplate, fillTemplate, htmlToPdf, qrDataUrl, templateHtml } from "../../utils/toa/render.js";

const MAX_BYTES = 300 * 1024;

// ** example values used for "preview" so the admin can check a template before saving it
const SAMPLE = async () => ({
  certificateNumber: "CUTM/RT-TOA/2026/000123",
  issueDate: "05 Nov 2026",
  name: "Priya Nayak",
  registrationId: "TOA-AS-2026-00042",
  programmeName: "Training of Assessors – Signalling",
  trainingPartner: "Rail Skills Pvt Ltd",
  batchCode: "TOA-B-2026-0007",
  startDate: "01 Oct 2026",
  endDate: "10 Oct 2026",
  result: "Pass",
  qrCode: await qrDataUrl("https://example.org/verify/toa/sample"),
  verifyUrl: "example.org/verify/toa/sample",
  invoiceNumber: "CUTM/TOA/2026-27/0012",
  invoiceDate: "12 Oct 2026",
  dueDate: "27 Oct 2026",
  payer: { organizationName: "Rail Skills Pvt Ltd", tpCode: "TOA-TP-0001", address: "Plot 7, Bhubaneswar", state: "Odisha", gstNumber: "21ABCDE1234F1Z5", email: "ops@railskills.in" },
  lines: [{ description: "ToA programme fee per assessor", quantity: 20, rate: "2,500.00", amount: "50,000.00" }],
  subtotal: "50,000.00",
  gstPercent: 18,
  gstAmount: "9,000.00",
  total: "59,000.00",
  statusLabel: "Unpaid",
  receiptNumber: "CUTM/TOA/RCPT/2026-27/00031",
  paidAt: "14 Oct 2026",
  organizationName: "Rail Skills Pvt Ltd",
  tpCode: "TOA-TP-0001",
  method: "UPI",
  gateway: "Razorpay",
  paymentId: "pay_Q1w2e3r4t5",
  orderId: "order_Q9w8e7r6t5",
  amount: "59,000.00",
  sessionDate: "02 Oct 2026",
  sessionTime: "10:00 – 13:00",
  sessionTopic: "Assessment methods",
  trainingMode: "Offline",
  venue: "CUTM Bhubaneswar campus",
  trainerName: "R. Mohanty",
  rows: [
    { registrationId: "TOA-AS-2026-00042", name: "Priya Nayak", status: "Present" },
    { registrationId: "TOA-AS-2026-00043", name: "Arjun Das", status: "Absent" },
  ],
});

// ** templates used to be one per type; the old unique index on "type" alone would block partner templates
let legacyIndexDropped = null;
const dropLegacyIndex = () =>
  (legacyIndexDropped ??= ToaTemplate.collection.dropIndex("type_1").catch((error) => {
    if (!/index not found|ns not found|NamespaceNotFound|IndexNotFound/i.test(error.message)) logger.warn(`toa template index: ${error.message}`);
  }));

class ToaTemplateService {
  assertType(type) {
    if (!TEMPLATE_TYPES.includes(type)) throw new AppError(`template must be one of ${TEMPLATE_TYPES.join(", ")}`);
  }

  // ** null = the general template for every partner
  async scope(toaTpId) {
    if (!toaTpId || toaTpId === "default") return null;
    if (!mongoose.isValidObjectId(toaTpId) || !(await ToaTrainingPartner.exists({ _id: toaTpId }))) throw AppError.notFound("training partner not found");
    return String(toaTpId);
  }

  // ** for each type: the template that applies at this level and where it comes from
  async list(toaTpIdParam) {
    const toaTpId = await this.scope(toaTpIdParam);
    const rows = await ToaTemplate.find({ toaTpId: { $in: toaTpId ? [toaTpId, null] : [null] } }).lean();
    return TEMPLATE_TYPES.map((type) => {
      const own = rows.find((row) => row.type === type && String(row.toaTpId) === String(toaTpId));
      const general = rows.find((row) => row.type === type && row.toaTpId === null);
      const used = own ?? general;
      return {
        type,
        // ** partner = this partner's own, default = the general CUTM one, built-in = the file shipped with the portal
        source: own ? (toaTpId ? "partner" : "default") : general ? "default" : "built-in",
        custom: Boolean(own),
        version: own?.version ?? 0,
        updatedAt: own?.updatedAt ?? null,
        html: used?.html ?? builtInTemplate(type),
      };
    });
  }

  // ** which partners have their own template (for the admin overview)
  async partnersWithOwnTemplates() {
    const rows = await ToaTemplate.find({ toaTpId: { $ne: null } }).select("type toaTpId").populate("toaTpId", "organizationName tpCode").lean();
    return rows.map((row) => ({ type: row.type, toaTpId: row.toaTpId?._id, organizationName: row.toaTpId?.organizationName, tpCode: row.toaTpId?.tpCode }));
  }

  validate(html) {
    const value = String(html ?? "");
    if (!value.trim()) throw new AppError("the template is empty");
    if (Buffer.byteLength(value) > MAX_BYTES) throw new AppError("the template is larger than 300 KB; embed smaller images");
    if (/<script|javascript:|on\w+\s*=/i.test(value)) throw new AppError("templates cannot contain scripts or event handlers");
    return value;
  }

  async save(type, html, toaTpIdParam, adminId, context) {
    this.assertType(type);
    const value = this.validate(html);
    const toaTpId = await this.scope(toaTpIdParam);
    await dropLegacyIndex();
    const saved = await ToaTemplate.findOneAndUpdate({ type, toaTpId }, { $set: { html: value, updatedBy: adminId }, $inc: { version: 1 } }, { upsert: true, new: true });
    await audit(context, { module: "toa", entity: "ToaTemplate", entityId: saved._id, action: "template_saved", note: `${type} v${saved.version} for ${toaTpId ? `partner ${toaTpId}` : "all partners"}` });
    return saved;
  }

  // ** a partner falls back to the general template, the general one to the built-in file
  async reset(type, toaTpIdParam, context) {
    this.assertType(type);
    const toaTpId = await this.scope(toaTpIdParam);
    await ToaTemplate.deleteOne({ type, toaTpId });
    await audit(context, { module: "toa", entity: "ToaTemplate", action: "template_reset", note: `${type} for ${toaTpId ? `partner ${toaTpId}` : "all partners"}` });
    return true;
  }

  async preview(type, html, toaTpIdParam) {
    this.assertType(type);
    const toaTpId = await this.scope(toaTpIdParam);
    const value = html ? this.validate(html) : await templateHtml(type, toaTpId);
    return htmlToPdf(fillTemplate(value, await SAMPLE()), { landscape: type === "certificate" });
  }
}

export default ToaTemplateService;
