import mongoose from "mongoose";
import ToaInvoice from "../../models/toa/ToaInvoice.model.js";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import { notify } from "./ToaNotificationService.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { audit } from "../../utils/audit.js";
import { financialYear, nextNumber, pad } from "../../utils/toa/sequence.js";
import { toaSettings } from "../../utils/toa/settings.js";
import { renderPdf } from "../../utils/toa/render.js";

const money = (value) => Math.round(value * 100) / 100;
const inr = (value) => Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");

class ToaInvoiceService {
  // ** raised once when CUTM approves a batch; the unique batch index makes a second one impossible
  async createForBatch(batch, context) {
    const existing = await ToaInvoice.findOne({ batch: batch._id });
    if (existing) return existing;
    const settings = await toaSettings(batch.toaTpId);
    const tp = await ToaTrainingPartner.findById(batch.toaTpId).lean();
    const count = batch.trainees.length;
    const lines =
      settings.feeMode === "per_batch"
        ? [{ description: `ToA programme fee – batch ${batch.batchCode} (${count} assessors)`, quantity: 1, rate: settings.feeAmount, amount: money(settings.feeAmount) }]
        : [{ description: `ToA programme fee per assessor – batch ${batch.batchCode}`, quantity: count, rate: settings.feeAmount, amount: money(settings.feeAmount * count) }];
    const subtotal = money(lines.reduce((sum, line) => sum + line.amount, 0));
    const gstAmount = money((subtotal * settings.gstPercent) / 100);
    const fy = financialYear();
    const invoice = await ToaInvoice.create({
      invoiceNumber: `CUTM/TOA/${fy}/${pad(await nextNumber(`toa_invoice_${fy}`), 4)}`,
      batch: batch._id,
      toaTpId: batch.toaTpId,
      payer: { organizationName: tp.organizationName, tpCode: tp.tpCode, address: tp.address, state: tp.state, gstNumber: tp.gstNumber, email: tp.email },
      feeMode: settings.feeMode,
      lines,
      subtotal,
      gstPercent: settings.gstPercent,
      gstAmount,
      total: money(subtotal + gstAmount),
      dueDate: new Date(Date.now() + settings.invoiceDueDays * 86400000),
      // ** a free programme needs no payment
      ...(subtotal + gstAmount === 0 ? { status: "paid", paidAt: new Date() } : {}),
    });
    await audit(context, { module: "toa", entity: "ToaInvoice", entityId: invoice._id, action: "invoice_generated", after: { invoiceNumber: invoice.invoiceNumber, total: invoice.total, batch: batch.batchCode } });
    await notify({
      role: ROLES.TOA_TRAINING_PARTNER,
      id: tp._id,
      email: tp.email,
      title: `Invoice ${invoice.invoiceNumber} generated`,
      message: `Invoice ${invoice.invoiceNumber} for batch ${batch.batchCode} is ready: ₹${inr(invoice.total)}, due ${day(invoice.dueDate)}.`,
      link: "/toa/payments",
    });
    return invoice;
  }

  async getForTp(id, tpId) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const invoice = await ToaInvoice.findOne({ _id: id, toaTpId: tpId }).populate("batch", "batchCode programmeName startDate endDate").populate("payment");
    if (!invoice) throw AppError.notFound("invoice not found");
    return invoice;
  }

  async getForAdmin(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const invoice = await ToaInvoice.findById(id).populate("batch", "batchCode programmeName startDate endDate").populate("payment");
    if (!invoice) throw AppError.notFound("invoice not found");
    return invoice;
  }

  async list(filter = {}) {
    return ToaInvoice.find(filter).sort({ invoiceDate: -1 }).populate("batch", "batchCode programmeName").populate("payment", "status receiptNumber paymentId");
  }

  async pdf(invoice) {
    const batch = invoice.batch;
    return renderPdf("invoice", {
      ...invoice.toObject(),
      invoiceDate: day(invoice.invoiceDate),
      dueDate: day(invoice.dueDate),
      batchCode: batch.batchCode,
      programmeName: batch.programmeName,
      startDate: day(batch.startDate),
      endDate: day(batch.endDate),
      lines: invoice.lines.map((line) => ({ ...line.toObject(), rate: inr(line.rate), amount: inr(line.amount) })),
      subtotal: inr(invoice.subtotal),
      gstAmount: inr(invoice.gstAmount),
      total: inr(invoice.total),
      statusLabel: { unpaid: "Unpaid", paid: `Paid on ${day(invoice.paidAt)}`, cancelled: "Cancelled", refunded: "Refunded" }[invoice.status],
    }, { toaTpId: invoice.toaTpId });
  }

  // ** CUTM can cancel an unpaid invoice (e.g. raised with a wrong fee) and raise a fresh one
  async cancelAndReissue(id, reason, batch, context) {
    const invoice = await this.getForAdmin(id);
    if (invoice.status !== "unpaid") throw new AppError("only unpaid invoices can be cancelled");
    if (!String(reason ?? "").trim()) throw new AppError("Please give a reason");
    // ** frees the batch's invoice slot so a corrected invoice can be raised
    await ToaInvoice.updateOne(
      { _id: invoice._id, status: "unpaid" },
      { $unset: { batch: 1 }, $set: { status: "cancelled", cancelledBatch: invoice.batch._id, cancelReason: String(reason).trim().slice(0, 500) } }
    );
    await audit(context, { module: "toa", entity: "ToaInvoice", entityId: invoice._id, action: "invoice_cancelled", note: String(reason).trim() });
    return this.createForBatch(batch, context);
  }
}

export { inr, day };
export default ToaInvoiceService;
