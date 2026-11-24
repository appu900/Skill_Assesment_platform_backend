import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import InvoiceRepository from "../repository/InvoiceRepository.js";
import Invoice from "../models/invoice.model.js";
import Batch from "../models/Batch.model.js";
import TrainingPartner from "../models/TrainingPartner.model.js";
import Sequence from "../models/sequence.model.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";
import { fillTemplate, htmlToPdf } from "../utils/toa/render.js";

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "../templates/core/batch_invoice.html");
const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;
const money = (value) => round2(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");

// ** INV-<year>-<00001>, one sequence for every batch invoice
async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const sequence = await Sequence.findByIdAndUpdate(`batch_invoice_${year}`, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `INV-${year}-${String(sequence.seq).padStart(5, "0")}`;
}

class InvoiceService {
  constructor() {
    this.invoiceRepository = new InvoiceRepository();
  }

  async createInvoice(data) {
    return this.invoiceRepository.create(data);
  }

  async getInvoiceByBatchId(batchId) {
    return this.invoiceRepository.getByBatchId(batchId);
  }

  // ** one invoice per batch, created on first use and updated afterwards
  async upsertBatchInvoice(batchId, data) {
    const invoice = await this.invoiceRepository.getByBatchId(batchId);
    if (invoice) {
      return this.invoiceRepository.update(invoice._id, data);
    }
    return this.invoiceRepository.create(data);
  }

  // ** the payment invoice of a submitted batch; a resubmission updates the same invoice (same number)
  async issueForBatch(batch, { candidates, rate, gstPercent = 0, total }) {
    const subtotal = round2(rate * candidates);
    const amount = round2(total ?? subtotal * (1 + gstPercent / 100));
    const existing = await this.invoiceRepository.getByBatchId(batch._id);
    const fields = {
      payer: "TrainingPartner",
      payee: "Admin",
      purpose: "batch payment",
      TrainingPartnerId: batch.trainingOrganizationId,
      BatchId: batch._id,
      candidates,
      ratePerCandidate: round2(rate),
      subtotal,
      gstPercent,
      gstAmount: round2(amount - subtotal),
      amount,
      paymentStatus: false,
      cancelled: false,
      cancelReason: null,
      issuedAt: new Date(),
      invoiceNumber: existing?.invoiceNumber || (await nextInvoiceNumber()),
    };
    return existing ? this.invoiceRepository.update(existing._id, fields) : this.invoiceRepository.create(fields);
  }

  // ** the batch went back to the training partner before payment: its invoice no longer applies
  async cancelForBatch(batchId, reason) {
    const invoice = await this.invoiceRepository.getByBatchId(batchId);
    if (!invoice || invoice.paymentStatus) return null;
    return this.invoiceRepository.update(invoice._id, { cancelled: true, cancelReason: reason ? String(reason).slice(0, 300) : null });
  }

  // ** batches submitted before invoices existed get theirs on first view
  async backfill(trainingPartnerId) {
    const filter = { batchActivePermission: true, amountToPaid: { $gt: 0 } };
    if (trainingPartnerId) filter.trainingOrganizationId = trainingPartnerId;
    const batches = await Batch.find(filter).select("_id trainingOrganizationId students perStudentCost amountToPaid paymentStatus transactionId").lean();
    if (!batches.length) return;
    const numbered = new Set(
      (await Invoice.find({ BatchId: { $in: batches.map((batch) => batch._id) }, invoiceNumber: { $type: "string" } }).select("BatchId").lean()).map((invoice) => String(invoice.BatchId))
    );
    for (const batch of batches.filter((item) => !numbered.has(String(item._id)))) {
      const candidates = batch.students?.length || 0;
      const rate = batch.perStudentCost || (candidates ? batch.amountToPaid / candidates : batch.amountToPaid);
      const subtotal = round2(rate * Math.max(candidates, 1));
      const gstPercent = subtotal > 0 ? Math.max(round2((batch.amountToPaid / subtotal - 1) * 100), 0) : 0;
      const invoice = await this.issueForBatch(batch, { candidates: Math.max(candidates, 1), rate, gstPercent, total: batch.amountToPaid });
      if (batch.paymentStatus) await this.invoiceRepository.update(invoice._id, { paymentStatus: true, transactionId: batch.transactionId });
    }
  }

  // ** training partner: its own invoices; admin: every invoice (optionally of one training partner)
  async list(user, query = {}) {
    const trainingPartnerId = user.role === ROLES.TRAINING_PARTNER ? user.id : query.trainingPartnerId;
    if (trainingPartnerId && !mongoose.isValidObjectId(trainingPartnerId)) throw new AppError("invalid training partner id");
    await this.backfill(trainingPartnerId);
    const filter = { invoiceNumber: { $type: "string" } };
    if (trainingPartnerId) filter.TrainingPartnerId = trainingPartnerId;
    return Invoice.find(filter)
      .sort({ issuedAt: -1, createdAt: -1 })
      .populate("BatchId", "ABN_Number courseName centerName scheme schemeType startDate endDate paymentStatus clientPaymentStatus")
      .populate("TrainingPartnerId", "organizationName tpCode")
      .lean();
  }

  async pdf(batchId, user) {
    if (!mongoose.isValidObjectId(batchId)) throw new AppError("invalid batch id");
    const batch = await Batch.findById(batchId).lean();
    if (!batch) throw AppError.notFound("batch not found");
    assertOwnerOrAdmin(batch.trainingOrganizationId, user, "This batch does not belong to you");
    await this.backfill(batch.trainingOrganizationId);
    const invoice = await Invoice.findOne({ BatchId: batch._id, invoiceNumber: { $type: "string" } }).lean();
    if (!invoice) throw AppError.notFound("this batch has no invoice yet; it is issued when the batch is submitted");
    const tp = (await TrainingPartner.findById(batch.trainingOrganizationId).lean()) || {};

    const status = invoice.cancelled ? "Cancelled" : invoice.paymentStatus ? "Paid" : "Unpaid";
    const html = fillTemplate(fs.readFileSync(TEMPLATE, "utf8"), {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: day(invoice.issuedAt || invoice.createdAt),
      payer: {
        name: tp.organizationName,
        tpCode: tp.tpCode,
        address: [tp.registeredOfficeAddress, tp.registeredOfficeCity, tp.registeredOfficeDist, tp.registeredOfficeState, tp.registeredOfficePin].filter(Boolean).join(", "),
        gst: tp.registeredOfficeGst,
        email: tp.registeredOfficeEmail,
      },
      batch: {
        abn: batch.ABN_Number,
        course: batch.courseName,
        centre: batch.centerName,
        scheme: batch.scheme,
        period: `${day(batch.startDate)} – ${day(batch.endDate)}`,
      },
      lines: [
        {
          description: `Assessment and certification fee · ${batch.courseName ?? ""}`,
          quantity: invoice.candidates,
          rate: money(invoice.ratePerCandidate),
          amount: money(invoice.subtotal),
        },
      ],
      subtotal: money(invoice.subtotal),
      gstPercent: invoice.gstPercent,
      gstAmount: money(invoice.gstAmount),
      total: money(invoice.amount),
      statusLabel: status,
      paidNote: invoice.paymentStatus ? `Payment confirmed${invoice.transactionId ? ` · transaction ${invoice.transactionId}` : ""}` : "",
      cancelNote: invoice.cancelled ? `Cancelled: ${invoice.cancelReason || "batch sent back for changes"}` : "",
    });
    return { invoice, batch, pdf: await htmlToPdf(html) };
  }
}

export default InvoiceService;
