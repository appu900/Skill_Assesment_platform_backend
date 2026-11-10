import { StatusCodes } from "http-status-codes";
import ToaTraineeService from "../../service/toa/ToaTraineeService.js";
import ToaBatchService from "../../service/toa/ToaBatchService.js";
import ToaAttendanceService from "../../service/toa/ToaAttendanceService.js";
import ToaInvoiceService from "../../service/toa/ToaInvoiceService.js";
import ToaPaymentService from "../../service/toa/ToaPaymentService.js";
import ToaResultService from "../../service/toa/ToaResultService.js";
import ToaReportService from "../../service/toa/ToaReportService.js";
import ToaPayment from "../../models/toa/ToaPayment.model.js";
import { listNotifications, markRead } from "../../service/toa/ToaNotificationService.js";
import { TRAINEE_DOCUMENTS } from "../../models/toa/ToaTrainee.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import runUpload from "../../utils/runUpload.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { auditContext } from "../../utils/audit.js";
import { signedLink, toaUploader } from "../../utils/toa/storage.js";
import { sendFile, XLSX_TYPE } from "../../utils/toa/excel.js";

const trainees = new ToaTraineeService();
const batches = new ToaBatchService();
const attendance = new ToaAttendanceService();
const invoices = new ToaInvoiceService();
const payments = new ToaPaymentService();
const results = new ToaResultService();
const reports = new ToaReportService();

const send = (res, data, message = "ok", status = StatusCodes.OK) => res.status(status).json({ success: true, data, message });
const ctx = auditContext;
const documentUpload = toaUploader("trainees").fields(TRAINEE_DOCUMENTS.map((name) => ({ name, maxCount: 1 })));
const evidenceUpload = toaUploader("attendance").single("evidence");
const owned = (req) => batches.getOwned(req.params.id, req.toaTpId);
const actor = (req) => ({ id: req.toaTpId, role: ROLES.TOA_TRAINING_PARTNER });

export const dashboard = asyncHandler(async (req, res) => send(res, await reports.dashboard(req.toaTpId)));
export const notifications = asyncHandler(async (req, res) => send(res, await listNotifications(ROLES.TOA_TRAINING_PARTNER, req.toaTpId)));
export const readNotification = asyncHandler(async (req, res) => send(res, await markRead(ROLES.TOA_TRAINING_PARTNER, req.toaTpId, req.params.id)));
export const fileLink = asyncHandler(async (req, res) => send(res, { url: await signedLink(req.query.key, { tpId: req.toaTpId }) }));

// ---- assessors
export const listTrainees = asyncHandler(async (req, res) => send(res, await trainees.listForTp(req.toaTpId, req.query)));
export const eligibleTrainees = asyncHandler(async (req, res) => send(res, await trainees.eligibleForBatch(req.toaTpId, req.query.batch || null)));
export const getTrainee = asyncHandler(async (req, res) => send(res, await trainees.getOwned(req.params.id, req.toaTpId)));
export const createTrainee = asyncHandler(async (req, res) => send(res, await trainees.create(req.toaTpId, req.body, ctx(req)), "draft saved", StatusCodes.CREATED));
export const updateTrainee = asyncHandler(async (req, res) => send(res, await trainees.update(req.params.id, req.toaTpId, req.body, ctx(req)), "saved"));
export const uploadTraineeDocuments = asyncHandler(async (req, res) => {
  await trainees.getOwned(req.params.id, req.toaTpId);
  await runUpload(documentUpload, req, res);
  send(res, await trainees.attachDocuments(req.params.id, req.toaTpId, req.files, ctx(req)), "documents uploaded");
});
export const submitTrainee = asyncHandler(async (req, res) => send(res, await trainees.submit(req.params.id, req.toaTpId, ctx(req)), "submitted to CUTM"));
export const deleteTrainee = asyncHandler(async (req, res) => send(res, await trainees.removeDraft(req.params.id, req.toaTpId, ctx(req)), "draft deleted"));

// ---- batches
export const listBatches = asyncHandler(async (req, res) => send(res, await batches.listForTp(req.toaTpId, req.query)));
export const getBatch = asyncHandler(async (req, res) => send(res, await batches.detail(await owned(req))));
export const createBatch = asyncHandler(async (req, res) => send(res, await batches.create(req.toaTpId, req.body, ctx(req)), "batch created", StatusCodes.CREATED));
export const updateBatch = asyncHandler(async (req, res) => send(res, await batches.update(req.params.id, req.toaTpId, req.body, ctx(req)), "saved"));
export const setBatchTrainees = asyncHandler(async (req, res) => send(res, await batches.setTrainees(req.params.id, req.toaTpId, req.body?.trainees, ctx(req)), "roster saved"));
export const setBatchSessions = asyncHandler(async (req, res) => send(res, await batches.setSessions(req.params.id, req.toaTpId, req.body?.sessions, ctx(req)), "sessions saved"));
export const submitBatch = asyncHandler(async (req, res) => send(res, await batches.submit(req.params.id, req.toaTpId, ctx(req)), "batch submitted to CUTM"));
export const deleteBatch = asyncHandler(async (req, res) => send(res, await batches.removeDraft(req.params.id, req.toaTpId, ctx(req)), "draft deleted"));
export const rosterXlsx = asyncHandler(async (req, res) => {
  const batch = await batches.detail(await owned(req));
  const { workbookBuffer } = await import("../../utils/toa/excel.js");
  const buffer = await workbookBuffer(
    "Roster",
    [
      { header: "#", key: "index", width: 5 },
      { header: "Registration ID", key: "registrationId", width: 22 },
      { header: "Name", key: "name", width: 28 },
      { header: "Email", key: "email", width: 28 },
      { header: "Mobile", key: "mobile", width: 14 },
    ],
    batch.trainees.map(({ trainee }, index) => ({ index: index + 1, registrationId: trainee.registrationId, name: trainee.name, email: trainee.email, mobile: trainee.mobile })),
    { title: `Roster – ${batch.batchCode} · ${batch.programmeName}` }
  );
  sendFile(res, buffer, `${batch.batchCode}-roster.xlsx`, XLSX_TYPE);
});

// ---- attendance
export const attendanceMatrix = asyncHandler(async (req, res) => send(res, await attendance.matrix(await owned(req))));
export const getSessionAttendance = asyncHandler(async (req, res) => {
  const batch = await owned(req);
  send(res, await attendance.sessionView(batch, attendance.session(batch, req.params.sessionId)));
});
export const markAttendance = asyncHandler(async (req, res) => send(res, await attendance.mark(await owned(req), req.params.sessionId, req.body?.records, actor(req), ctx(req)), "attendance saved"));
export const uploadEvidence = asyncHandler(async (req, res) => {
  const batch = await owned(req);
  await runUpload(evidenceUpload, req, res);
  send(res, await attendance.attachEvidence(batch, req.params.sessionId, req.file, ctx(req)), "evidence uploaded");
});
export const submitAttendance = asyncHandler(async (req, res) => send(res, await attendance.submit(await owned(req), req.params.sessionId, ctx(req)), "attendance submitted to CUTM"));
export const attendanceSheet = asyncHandler(async (req, res) => {
  const batch = await owned(req);
  sendFile(res, await attendance.sheetPdf(batch, req.params.sessionId), `${batch.batchCode}-attendance.pdf`, "application/pdf");
});
export const attendanceXlsx = asyncHandler(async (req, res) => {
  const batch = await owned(req);
  sendFile(res, await attendance.reportXlsx(batch), `${batch.batchCode}-attendance.xlsx`, XLSX_TYPE);
});

// ---- invoices and payments
export const listInvoices = asyncHandler(async (req, res) => send(res, await invoices.list({ toaTpId: req.toaTpId, status: { $ne: "cancelled" } })));
export const invoicePdf = asyncHandler(async (req, res) => {
  const invoice = await invoices.getForTp(req.params.id, req.toaTpId);
  sendFile(res, await invoices.pdf(invoice), `${invoice.invoiceNumber}.pdf`, "application/pdf");
});
export const listPayments = asyncHandler(async (req, res) => send(res, await payments.list({ toaTpId: req.toaTpId })));
export const payInvoice = asyncHandler(async (req, res) => send(res, await payments.createOrder(req.params.id, req.toaTpId, ctx(req)), "order created", StatusCodes.CREATED));
export const verifyPayment = asyncHandler(async (req, res) => send(res, await payments.verify(req.body ?? {}, req.toaTpId, ctx(req)), "payment confirmed"));
export const paymentFailed = asyncHandler(async (req, res) => send(res, await payments.markFailed(req.params.orderId, req.toaTpId, req.body ?? {}, ctx(req)), "payment updated"));
export const mockCheckout = asyncHandler(async (req, res) => {
  await payments.ownedPayment(req.params.orderId, req.toaTpId);
  send(res, payments.mockComplete(req.params.orderId));
});
export const receiptPdf = asyncHandler(async (req, res) => {
  const payment = await ToaPayment.findOne({ _id: req.params.id, toaTpId: req.toaTpId });
  if (!payment) throw AppError.notFound("payment not found");
  sendFile(res, await payments.receiptPdf(payment), `${payment.receiptNumber ?? "receipt"}.pdf`, "application/pdf");
});

// ---- results (visible once CUTM publishes them)
export const batchResults = asyncHandler(async (req, res) => {
  const batch = await owned(req);
  if (batch.resultsStatus !== "published") throw new AppError("results of this batch are not published yet");
  send(res, await results.grid(batch));
});
export const certificatePdf = asyncHandler(async (req, res) => {
  const certificate = await results.certificate(req.params.id);
  if (String(certificate.toaTpId) !== req.toaTpId) throw AppError.forbidden("This certificate is not from your batches");
  sendFile(res, await results.certificatePdf(certificate), `${certificate.snapshot.registrationId}-certificate.pdf`, "application/pdf");
});
