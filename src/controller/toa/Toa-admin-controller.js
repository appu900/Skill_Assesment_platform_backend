import { StatusCodes } from "http-status-codes";
import ToaTpAdminService from "../../service/toa/ToaTpAdminService.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { auditContext } from "../../utils/audit.js";
import ToaTraineeService from "../../service/toa/ToaTraineeService.js";
import ToaBatchService from "../../service/toa/ToaBatchService.js";
import ToaAttendanceService from "../../service/toa/ToaAttendanceService.js";
import ToaInvoiceService from "../../service/toa/ToaInvoiceService.js";
import ToaPaymentService from "../../service/toa/ToaPaymentService.js";
import ToaResultService from "../../service/toa/ToaResultService.js";
import ToaReportService from "../../service/toa/ToaReportService.js";
import ToaTemplateService from "../../service/toa/ToaTemplateService.js";
import AppError from "../../utils/AppError.js";
import runUpload from "../../utils/runUpload.js";
import { signedLink } from "../../utils/toa/storage.js";
import { sendFile, XLSX_TYPE } from "../../utils/toa/excel.js";
import multer from "multer";

const service = new ToaTpAdminService();

const send = (res, data, message, status = StatusCodes.OK) => res.status(status).json({ success: true, data, message });

const createToaTp = asyncHandler(async (req, res) =>
  send(res, await service.create(req.body, req.user.id, auditContext(req)), "training partner created, login details are emailed", StatusCodes.CREATED)
);
const listToaTps = asyncHandler(async (req, res) => send(res, await service.list(req.query), "training partners fetched"));
const getToaTp = asyncHandler(async (req, res) => send(res, await service.get(req.params.id), "training partner fetched"));
const updateToaTp = asyncHandler(async (req, res) => send(res, await service.update(req.params.id, req.body, auditContext(req)), "training partner updated"));
const setToaTpStatus = asyncHandler(async (req, res) =>
  send(res, await service.setStatus(req.params.id, req.body?.status, req.body?.reason, auditContext(req)), "status updated")
);
const unlockToaTp = asyncHandler(async (req, res) => send(res, await service.unlock(req.params.id, auditContext(req)), "account unlocked"));
const resetToaTpPassword = asyncHandler(async (req, res) =>
  send(res, await service.resetPassword(req.params.id, auditContext(req)), "a new temporary password is emailed")
);
const getToaAuditLogs = asyncHandler(async (req, res) => send(res, await service.auditLogs(req.query), "audit log fetched"));

export { createToaTp, listToaTps, getToaTp, updateToaTp, setToaTpStatus, unlockToaTp, resetToaTpPassword, getToaAuditLogs };

// ---------------------------------------------------------------- assessors, batches, attendance, money, results, reports
const trainees = new ToaTraineeService();
const batches = new ToaBatchService();
const attendance = new ToaAttendanceService();
const invoices = new ToaInvoiceService();
const payments = new ToaPaymentService();
const results = new ToaResultService();
const reports = new ToaReportService();
const templates = new ToaTemplateService();
const ctx = auditContext;
const ok = (res, data, message = "ok", status = StatusCodes.OK) => send(res, data, message, status);
const batchOf = (req) => batches.getForAdmin(req.params.id);
// ** the results workbook is read in memory and never stored
const sheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (/\.xlsx$/i.test(file.originalname) ? cb(null, true) : cb(new Error("upload the .xlsx results template"), false)),
}).single("file");

export const adminDashboard = asyncHandler(async (req, res) => ok(res, await reports.dashboard()));
export const adminFileLink = asyncHandler(async (req, res) => ok(res, { url: await signedLink(req.query.key, { isAdmin: true }) }));

// ---- assessor applications
export const adminListTrainees = asyncHandler(async (req, res) => ok(res, await trainees.listForAdmin(req.query)));
export const adminGetTrainee = asyncHandler(async (req, res) => ok(res, await trainees.getForAdmin(req.params.id)));
export const adminReviewTrainee = asyncHandler(async (req, res) => ok(res, await trainees.startReview(req.params.id, req.user.id, ctx(req)), "under review"));
export const adminDecideTrainee = asyncHandler(async (req, res) => ok(res, await trainees.decide(req.params.id, req.body?.decision, req.body?.remarks, req.user.id, ctx(req)), "decision saved"));
export const adminTraineePortal = asyncHandler(async (req, res) => ok(res, await trainees.setPortalAccess(req.params.id, req.body?.enabled, req.user.id, ctx(req)), "portal access updated"));

// ---- batches
export const adminListBatches = asyncHandler(async (req, res) => ok(res, await batches.listForAdmin(req.query)));
export const adminGetBatch = asyncHandler(async (req, res) => ok(res, await batches.detail(await batchOf(req))));
export const adminReviewBatch = asyncHandler(async (req, res) => ok(res, await batches.startReview(req.params.id, req.user.id, ctx(req)), "under review"));
export const adminDecideBatch = asyncHandler(async (req, res) => ok(res, await batches.decide(req.params.id, req.body?.decision, req.body?.remarks, req.user.id, ctx(req)), "decision saved"));

// ---- attendance
export const adminAttendanceMatrix = asyncHandler(async (req, res) => ok(res, await attendance.matrix(await batchOf(req))));
export const adminSessionAttendance = asyncHandler(async (req, res) => {
  const batch = await batchOf(req);
  ok(res, await attendance.sessionView(batch, attendance.session(batch, req.params.sessionId)));
});
export const adminDecideAttendance = asyncHandler(async (req, res) => ok(res, await attendance.decide(await batchOf(req), req.params.sessionId, req.body?.decision, req.body?.remarks, ctx(req)), "attendance updated"));
export const adminAttendanceSheet = asyncHandler(async (req, res) => {
  const batch = await batchOf(req);
  sendFile(res, await attendance.sheetPdf(batch, req.params.sessionId), `${batch.batchCode}-attendance.pdf`, "application/pdf");
});
export const adminAttendanceXlsx = asyncHandler(async (req, res) => {
  const batch = await batchOf(req);
  sendFile(res, await attendance.reportXlsx(batch), `${batch.batchCode}-attendance.xlsx`, XLSX_TYPE);
});

// ---- money
export const adminListInvoices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.toaTpId) filter.toaTpId = req.query.toaTpId;
  ok(res, await invoices.list(filter));
});
export const adminInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await invoices.getForAdmin(req.params.id);
  sendFile(res, await invoices.pdf(invoice), `${invoice.invoiceNumber}.pdf`, "application/pdf");
});
export const adminCancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoices.getForAdmin(req.params.id);
  const batch = await batches.getForAdmin(invoice.batch?._id);
  ok(res, await invoices.cancelAndReissue(req.params.id, req.body?.reason, batch, ctx(req)), "invoice cancelled and a new one raised");
});
export const adminListPayments = asyncHandler(async (req, res) => ok(res, await payments.list(req.query.status ? { status: String(req.query.status) } : {})));
export const adminRefund = asyncHandler(async (req, res) => ok(res, await payments.refund(req.params.id, req.body?.reason, ctx(req)), "refund recorded"));
export const adminReceiptPdf = asyncHandler(async (req, res) => {
  const payment = await payments.view(req.params.id);
  if (!payment) throw AppError.notFound("payment not found");
  sendFile(res, await payments.receiptPdf(payment), `${payment.receiptNumber ?? "receipt"}.pdf`, "application/pdf");
});
export const adminFinanceXlsx = asyncHandler(async (req, res) => sendFile(res, await reports.financeXlsx(req.query), "toa-invoices.xlsx", XLSX_TYPE));

// ---- results and certificates
export const adminResultsGrid = asyncHandler(async (req, res) => ok(res, await results.grid(await batchOf(req))));
export const adminSaveResults = asyncHandler(async (req, res) => ok(res, await results.save(await batchOf(req), req.body?.entries, req.user.id, ctx(req)), "results saved"));
export const adminResultsTemplate = asyncHandler(async (req, res) => {
  const batch = await batchOf(req);
  sendFile(res, await results.templateXlsx(batch), `${batch.batchCode}-results-template.xlsx`, XLSX_TYPE);
});
export const adminImportResults = asyncHandler(async (req, res) => {
  const batch = await batchOf(req);
  await runUpload(sheetUpload, req, res);
  ok(res, await results.importXlsx(batch, req.file?.buffer, req.user.id, ctx(req)), "results imported");
});
export const adminApproveResults = asyncHandler(async (req, res) => ok(res, await results.approve(await batchOf(req), req.user.id, ctx(req)), "results approved"));
export const adminPublishResults = asyncHandler(async (req, res) => ok(res, await results.publish(await batchOf(req), req.user.id, ctx(req)), "results published"));
export const adminListCertificates = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.batch) filter.batch = req.query.batch;
  ok(res, await results.listCertificates(filter));
});
export const adminCertificatePdf = asyncHandler(async (req, res) => {
  const certificate = await results.certificate(req.params.id);
  sendFile(res, await results.certificatePdf(certificate), `${certificate.snapshot.registrationId}-certificate.pdf`, "application/pdf");
});
export const adminRevokeCertificate = asyncHandler(async (req, res) => ok(res, await results.revoke(req.params.id, req.body?.reason, ctx(req)), "certificate revoked"));
export const adminReissueCertificate = asyncHandler(async (req, res) => ok(res, await results.reissue(req.params.id, req.body ?? {}, req.user.id, ctx(req)), "certificate reissued"));

// ---- templates and reports
export const adminListTemplates = asyncHandler(async (req, res) => ok(res, await templates.list(req.query.toaTpId)));
export const adminPartnerTemplates = asyncHandler(async (req, res) => ok(res, await templates.partnersWithOwnTemplates()));
export const adminSaveTemplate = asyncHandler(async (req, res) => ok(res, await templates.save(req.params.type, req.body?.html, req.query.toaTpId, req.user.id, ctx(req)), "template saved"));
export const adminResetTemplate = asyncHandler(async (req, res) => ok(res, await templates.reset(req.params.type, req.query.toaTpId, ctx(req)), "built-in template restored"));
export const adminPreviewTemplate = asyncHandler(async (req, res) => sendFile(res, await templates.preview(req.params.type, req.body?.html, req.query.toaTpId), `${req.params.type}-preview.pdf`, "application/pdf"));
export const adminReport = asyncHandler(async (req, res) => {
  if (req.query.format === "xlsx") return sendFile(res, await reports.xlsx(req.query), "toa-report.xlsx", XLSX_TYPE);
  if (req.query.format === "pdf") return sendFile(res, await reports.pdf(req.query), "toa-report.pdf", "application/pdf");
  ok(res, await reports.rows(req.query));
});