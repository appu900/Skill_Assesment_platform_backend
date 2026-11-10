import express from "express";
import { allow, ROLES } from "../../../middleware/auth.js";
import { loginLimiter } from "../../../middleware/rateLimiter.js";
import { requireToaAssessor, requireToaTp, requireToaTpPendingPassword } from "../../../middleware/toaAuth.js";
import { assessorAuth, tpAuth } from "../../../controller/toa/Toa-auth-controller.js";
import * as tp from "../../../controller/toa/Toa-tp-controller.js";
import * as admin from "../../../controller/toa/Toa-admin-controller.js";
import * as assessor from "../../../controller/toa/Toa-assessor-controller.js";
import * as open from "../../../controller/toa/Toa-public-controller.js";

// ** RailTel Training of Assessors module: everything lives under /v1/toa and only ToA accounts (or the CUTM admin) get in
const router = express.Router();

// ---------------------------------------------------------------- public
router.get("/public/verify/:code", open.verifyCertificate);
router.post("/payments/webhook/razorpay", open.paymentWebhook);

// ---------------------------------------------------------------- training partner
router.post("/tp/login", loginLimiter, tpAuth.login);
router.post("/tp/forgot-password", loginLimiter, tpAuth.forgotPassword);
router.post("/tp/reset-password", loginLimiter, tpAuth.resetPassword);
router.get("/tp/me", requireToaTpPendingPassword, tpAuth.profile);
router.put("/tp/me/password", requireToaTpPendingPassword, tpAuth.changePassword);

const t = express.Router();
t.use(requireToaTp);
t.get("/dashboard", tp.dashboard);
t.get("/notifications", tp.notifications);
t.put("/notifications/:id/read", tp.readNotification);
t.get("/files", tp.fileLink);

t.get("/assessors", tp.listTrainees);
t.get("/assessors/eligible", tp.eligibleTrainees);
t.post("/assessors", tp.createTrainee);
t.get("/assessors/:id", tp.getTrainee);
t.put("/assessors/:id", tp.updateTrainee);
t.put("/assessors/:id/documents", tp.uploadTraineeDocuments);
t.put("/assessors/:id/submit", tp.submitTrainee);
t.delete("/assessors/:id", tp.deleteTrainee);

t.get("/batches", tp.listBatches);
t.post("/batches", tp.createBatch);
t.get("/batches/:id", tp.getBatch);
t.put("/batches/:id", tp.updateBatch);
t.put("/batches/:id/assessors", tp.setBatchTrainees);
t.put("/batches/:id/sessions", tp.setBatchSessions);
t.put("/batches/:id/submit", tp.submitBatch);
t.delete("/batches/:id", tp.deleteBatch);
t.get("/batches/:id/roster.xlsx", tp.rosterXlsx);
t.get("/batches/:id/attendance", tp.attendanceMatrix);
t.get("/batches/:id/attendance.xlsx", tp.attendanceXlsx);
t.get("/batches/:id/sessions/:sessionId/attendance", tp.getSessionAttendance);
t.put("/batches/:id/sessions/:sessionId/attendance", tp.markAttendance);
t.put("/batches/:id/sessions/:sessionId/evidence", tp.uploadEvidence);
t.put("/batches/:id/sessions/:sessionId/submit", tp.submitAttendance);
t.get("/batches/:id/sessions/:sessionId/sheet.pdf", tp.attendanceSheet);
t.get("/batches/:id/results", tp.batchResults);

t.get("/invoices", tp.listInvoices);
t.get("/invoices/:id/pdf", tp.invoicePdf);
t.post("/invoices/:id/pay", tp.payInvoice);
t.get("/payments", tp.listPayments);
t.post("/payments/verify", tp.verifyPayment);
t.put("/payments/:orderId/failed", tp.paymentFailed);
t.post("/payments/:orderId/mock-checkout", tp.mockCheckout);
t.get("/payments/:id/receipt", tp.receiptPdf);
t.get("/certificates/:id/pdf", tp.certificatePdf);
router.use("/tp", t);

// ---------------------------------------------------------------- assessor (person trained)
router.post("/assessor/login", loginLimiter, assessorAuth.login);
router.post("/assessor/forgot-password", loginLimiter, assessorAuth.forgotPassword);
router.post("/assessor/reset-password", loginLimiter, assessorAuth.resetPassword);
const a = express.Router();
a.use(requireToaAssessor);
a.get("/me", assessorAuth.profile);
a.put("/me/password", assessorAuth.changePassword);
a.get("/overview", assessor.assessorOverview);
a.get("/notifications", assessor.assessorNotifications);
a.put("/notifications/:id/read", assessor.assessorReadNotification);
a.get("/certificates/:id/pdf", assessor.assessorCertificatePdf);
router.use("/assessor", a);

// ---------------------------------------------------------------- CUTM admin
const m = express.Router();
m.use(allow(ROLES.ADMIN));
m.post("/tps", admin.createToaTp);
m.get("/tps", admin.listToaTps);
m.get("/tps/:id", admin.getToaTp);
m.put("/tps/:id", admin.updateToaTp);
m.put("/tps/:id/status", admin.setToaTpStatus);
m.put("/tps/:id/unlock", admin.unlockToaTp);
m.put("/tps/:id/reset-password", admin.resetToaTpPassword);
m.get("/audit-logs", admin.getToaAuditLogs);
m.get("/dashboard", admin.adminDashboard);
m.get("/files", admin.adminFileLink);

m.get("/assessors", admin.adminListTrainees);
m.get("/assessors/:id", admin.adminGetTrainee);
m.put("/assessors/:id/review", admin.adminReviewTrainee);
m.put("/assessors/:id/decision", admin.adminDecideTrainee);
m.put("/assessors/:id/portal", admin.adminTraineePortal);

m.get("/batches", admin.adminListBatches);
m.get("/batches/:id", admin.adminGetBatch);
m.put("/batches/:id/review", admin.adminReviewBatch);
m.put("/batches/:id/decision", admin.adminDecideBatch);
m.get("/batches/:id/attendance", admin.adminAttendanceMatrix);
m.get("/batches/:id/attendance.xlsx", admin.adminAttendanceXlsx);
m.get("/batches/:id/sessions/:sessionId/attendance", admin.adminSessionAttendance);
m.put("/batches/:id/sessions/:sessionId/decision", admin.adminDecideAttendance);
m.get("/batches/:id/sessions/:sessionId/sheet.pdf", admin.adminAttendanceSheet);
m.get("/batches/:id/results", admin.adminResultsGrid);
m.put("/batches/:id/results", admin.adminSaveResults);
m.get("/batches/:id/results/template.xlsx", admin.adminResultsTemplate);
m.post("/batches/:id/results/import", admin.adminImportResults);
m.put("/batches/:id/results/approve", admin.adminApproveResults);
m.put("/batches/:id/results/publish", admin.adminPublishResults);

m.get("/invoices", admin.adminListInvoices);
m.get("/invoices.xlsx", admin.adminFinanceXlsx);
m.get("/invoices/:id/pdf", admin.adminInvoicePdf);
m.put("/invoices/:id/cancel", admin.adminCancelInvoice);
m.get("/payments", admin.adminListPayments);
m.put("/payments/:id/refund", admin.adminRefund);
m.get("/payments/:id/receipt", admin.adminReceiptPdf);

m.get("/certificates", admin.adminListCertificates);
m.get("/certificates/:id/pdf", admin.adminCertificatePdf);
m.put("/certificates/:id/revoke", admin.adminRevokeCertificate);
m.put("/certificates/:id/reissue", admin.adminReissueCertificate);

m.get("/templates", admin.adminListTemplates);
m.get("/templates/partners", admin.adminPartnerTemplates);
m.put("/templates/:type", admin.adminSaveTemplate);
m.delete("/templates/:type", admin.adminResetTemplate);
m.post("/templates/:type/preview", admin.adminPreviewTemplate);
m.get("/reports", admin.adminReport);
router.use("/admin", m);

export default router;
