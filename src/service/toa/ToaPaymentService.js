import mongoose from "mongoose";
import ToaPayment from "../../models/toa/ToaPayment.model.js";
import ToaInvoice from "../../models/toa/ToaInvoice.model.js";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import { notify } from "./ToaNotificationService.js";
import { day, inr } from "./ToaInvoiceService.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { audit } from "../../utils/audit.js";
import { gateway, gatewayByName } from "../../utils/toa/gateway.js";
import { financialYear, nextNumber, pad } from "../../utils/toa/sequence.js";
import { renderPdf } from "../../utils/toa/render.js";
import logger from "../../utils/logger.js";
import serverConfig from "../../config/serverConfig.js";

const toPaise = (rupees) => Math.round(rupees * 100);
const OPEN = ["created", "pending", "failed", "cancelled"];

class ToaPaymentService {
  // ** one gateway order per attempt; refused when the invoice is already paid
  async createOrder(invoiceId, tpId, context) {
    if (!mongoose.isValidObjectId(invoiceId)) throw new AppError("invalid id");
    const invoice = await ToaInvoice.findOne({ _id: invoiceId, toaTpId: tpId }).populate("batch", "batchCode");
    if (!invoice) throw AppError.notFound("invoice not found");
    if (invoice.status !== "unpaid") throw AppError.conflict(`this invoice is ${invoice.status}`);
    const provider = gateway();
    const { orderId } = await provider.createOrder({ amountPaise: toPaise(invoice.total), receipt: invoice.invoiceNumber.slice(0, 40), notes: { invoice: invoice.invoiceNumber, batch: invoice.batch?.batchCode } });
    const payment = await ToaPayment.create({
      invoice: invoice._id,
      toaTpId: tpId,
      gateway: provider.name,
      orderId,
      amount: invoice.total,
      events: [{ type: "order_created", source: "api" }],
    });
    await audit(context, { module: "toa", entity: "ToaPayment", entityId: payment._id, action: "payment_initiated", after: { invoice: invoice.invoiceNumber, amount: invoice.total, orderId } });
    const tp = await ToaTrainingPartner.findById(tpId).select("organizationName email mobile").lean();
    return {
      gateway: provider.name,
      key: provider.publicKey(),
      orderId,
      amount: toPaise(invoice.total),
      currency: "INR",
      name: "CUTM Awarding Body",
      description: `Invoice ${invoice.invoiceNumber}`,
      prefill: { name: tp?.organizationName, email: tp?.email, contact: tp?.mobile },
    };
  }

  // ** development only: what the mock checkout returns for "pay", like the razorpay popup would
  mockComplete(orderId) {
    const provider = gateway();
    if (provider.name !== "mock") throw new AppError("not available");
    return provider.complete(orderId);
  }

  async ownedPayment(orderId, tpId) {
    const payment = await ToaPayment.findOne({ orderId: String(orderId ?? ""), toaTpId: tpId });
    if (!payment) throw AppError.notFound("payment not found");
    return payment;
  }

  // ** the browser hands back order id, payment id and signature; the signature and the gateway's own record are both checked
  async verify({ orderId, paymentId, signature }, tpId, context) {
    const payment = await this.ownedPayment(orderId, tpId);
    if (payment.status === "successful" && payment.paymentId === paymentId) return this.view(payment._id);
    const provider = gatewayByName(payment.gateway);
    if (!paymentId || !provider.checkoutSignatureValid(payment.orderId, String(paymentId), String(signature ?? ""))) {
      payment.events.push({ type: "signature_invalid", source: "checkout" });
      await payment.save();
      await audit(context, { module: "toa", entity: "ToaPayment", entityId: payment._id, action: "payment_signature_invalid" });
      throw new AppError("the payment could not be verified");
    }
    const remote = await provider.fetchPayment(String(paymentId), payment.orderId);
    if (remote.orderId !== payment.orderId || remote.amountPaise !== toPaise(payment.amount) || remote.status !== "captured") {
      payment.status = "pending";
      payment.events.push({ type: "verification_mismatch", source: "gateway", detail: remote });
      await payment.save();
      throw new AppError("the payment is not confirmed by the gateway yet; it will update automatically once it is");
    }
    await this.markSuccessful(payment, String(paymentId), remote.method, "checkout", context);
    return this.view(payment._id);
  }

  // ** idempotent: a repeated callback or webhook for the same payment changes nothing
  async markSuccessful(payment, paymentId, method, source, context) {
    const updated = await ToaPayment.findOneAndUpdate(
      { _id: payment._id, status: { $in: OPEN } },
      { $set: { status: "successful", paymentId, method, verifiedAt: new Date() }, $push: { events: { type: "captured", source } } },
      { new: true }
    );
    if (!updated) return payment;

    const invoice = await ToaInvoice.findOneAndUpdate({ _id: updated.invoice, status: "unpaid" }, { $set: { status: "paid", paidAt: new Date(), payment: updated._id } }, { new: true }).populate("batch", "batchCode");
    if (!invoice) {
      // ** the invoice was already settled by another payment: keep the money traceable for a refund
      updated.status = "duplicate";
      updated.events.push({ type: "duplicate_payment", source });
      await updated.save();
      await audit(context, { module: "toa", entity: "ToaPayment", entityId: updated._id, action: "payment_duplicate", note: `paymentId ${paymentId}` });
      return updated;
    }
    const fy = financialYear();
    updated.receiptNumber = `CUTM/TOA/RCPT/${fy}/${pad(await nextNumber(`toa_receipt_${fy}`), 5)}`;
    await updated.save();
    await audit(context, { module: "toa", entity: "ToaPayment", entityId: updated._id, action: "payment_successful", after: { invoice: invoice.invoiceNumber, amount: updated.amount, paymentId, receipt: updated.receiptNumber, source } });
    const tp = await ToaTrainingPartner.findById(updated.toaTpId).select("email").lean();
    await notify({
      role: ROLES.TOA_TRAINING_PARTNER,
      id: updated.toaTpId,
      email: tp?.email,
      title: `Payment received for ${invoice.invoiceNumber}`,
      message: `We received ₹${inr(updated.amount)} for invoice ${invoice.invoiceNumber} (batch ${invoice.batch?.batchCode}). Receipt ${updated.receiptNumber} can be downloaded from the portal.`,
      link: "/toa/payments",
    });
    return updated;
  }

  async markFailed(orderId, tpId, { cancelled, reason }, context) {
    const payment = await this.ownedPayment(orderId, tpId);
    if (!["created", "pending"].includes(payment.status)) return payment;
    payment.status = cancelled ? "cancelled" : "failed";
    payment.failureReason = String(reason ?? "").slice(0, 300) || null;
    payment.events.push({ type: payment.status, source: "checkout" });
    await payment.save();
    await audit(context, { module: "toa", entity: "ToaPayment", entityId: payment._id, action: `payment_${payment.status}`, note: payment.failureReason });
    return payment;
  }

  // ** gateway → server notifications; signature over the raw body, every event handled idempotently
  async webhook(rawBody, signature, context) {
    const provider = gatewayByName(serverConfig.TOA_PAYMENT_GATEWAY);
    if (!provider.webhookSignatureValid(rawBody, String(signature ?? ""))) throw AppError.unauthorized("invalid signature");
    const event = JSON.parse(rawBody.toString("utf8"));
    const entity = event?.payload?.payment?.entity;
    const payment = entity?.order_id ? await ToaPayment.findOne({ orderId: entity.order_id }) : null;
    if (!payment) {
      logger.warn(`toa webhook ${event?.event} for an unknown order`);
      return { handled: false };
    }
    if (event.event === "payment.captured" && entity.amount === toPaise(payment.amount)) {
      await this.markSuccessful(payment, entity.id, entity.method, "webhook", context);
    } else if (event.event === "payment.failed" && ["created", "pending"].includes(payment.status)) {
      payment.status = "failed";
      payment.failureReason = entity.error_description ?? null;
      payment.events.push({ type: "failed", source: "webhook" });
      await payment.save();
    } else if (event.event === "refund.processed" && payment.status !== "refunded") {
      payment.events.push({ type: "refund_processed", source: "webhook" });
      await payment.save();
    }
    return { handled: true };
  }

  // ** CUTM refunds a successful (or duplicate) payment through the gateway
  async refund(paymentId, reason, context) {
    if (!mongoose.isValidObjectId(paymentId)) throw new AppError("invalid id");
    const payment = await ToaPayment.findById(paymentId);
    if (!payment) throw AppError.notFound("payment not found");
    if (!["successful", "duplicate"].includes(payment.status)) throw new AppError("only successful payments can be refunded");
    if (!String(reason ?? "").trim()) throw new AppError("Please give a reason for the refund");
    const { refundId } = await gatewayByName(payment.gateway).refund(payment.paymentId, toPaise(payment.amount));
    const wasInvoicePayment = payment.status === "successful";
    payment.status = "refunded";
    payment.refundId = refundId;
    payment.refundedAt = new Date();
    payment.refundReason = String(reason).trim().slice(0, 500);
    payment.events.push({ type: "refunded", source: "admin" });
    await payment.save();
    if (wasInvoicePayment) await ToaInvoice.updateOne({ _id: payment.invoice, payment: payment._id }, { status: "refunded" });
    await audit(context, { module: "toa", entity: "ToaPayment", entityId: payment._id, action: "payment_refunded", note: payment.refundReason, after: { refundId, amount: payment.amount } });
    const tp = await ToaTrainingPartner.findById(payment.toaTpId).select("email").lean();
    await notify({
      role: ROLES.TOA_TRAINING_PARTNER,
      id: payment.toaTpId,
      email: tp?.email,
      title: "Payment refunded",
      message: `CUTM refunded ₹${inr(payment.amount)} (transaction ${payment.paymentId}). Reason: ${payment.refundReason}`,
      link: "/toa/payments",
    });
    return payment;
  }

  async view(id) {
    return ToaPayment.findById(id).populate({ path: "invoice", select: "invoiceNumber total status batch", populate: { path: "batch", select: "batchCode" } });
  }

  async list(filter = {}) {
    return ToaPayment.find(filter).sort({ createdAt: -1 }).populate({ path: "invoice", select: "invoiceNumber total status batch", populate: { path: "batch", select: "batchCode" } }).populate("toaTpId", "organizationName tpCode");
  }

  async receiptPdf(payment) {
    if (!payment.receiptNumber) throw new AppError("there is no receipt for this payment");
    const invoice = await ToaInvoice.findById(payment.invoice).populate("batch", "batchCode").lean();
    const tp = await ToaTrainingPartner.findById(payment.toaTpId).select("organizationName tpCode").lean();
    return renderPdf("receipt", {
      receiptNumber: payment.receiptNumber,
      paidAt: day(payment.verifiedAt),
      organizationName: tp?.organizationName,
      tpCode: tp?.tpCode,
      invoiceNumber: invoice?.invoiceNumber,
      batchCode: invoice?.batch?.batchCode ?? "",
      method: (payment.method ?? "online").toUpperCase(),
      gateway: payment.gateway === "razorpay" ? "Razorpay" : "Test gateway",
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      amount: inr(payment.amount),
    }, { toaTpId: payment.toaTpId });
  }
}

export default ToaPaymentService;
