import { StatusCodes } from "http-status-codes";
import multer from "multer";
import OfflinePartnerService from "../../service/offline/OfflinePartnerService.js";
import OfflineBatchService from "../../service/offline/OfflineBatchService.js";
import OfflineDocumentService from "../../service/offline/OfflineDocumentService.js";
import asyncHandler from "../../utils/asyncHandler.js";
import runUpload from "../../utils/runUpload.js";
import { auditContext } from "../../utils/audit.js";
import { offlineSignedLink, offlineUploader } from "../../utils/toa/storage.js";
import { sendFile, XLSX_TYPE } from "../../utils/toa/excel.js";

const partners = new OfflinePartnerService();
const batches = new OfflineBatchService();
const documents = new OfflineDocumentService();
const ctx = auditContext;
const ok = (res, data, message = "ok", status = StatusCodes.OK) => res.status(status).json({ success: true, data, message });
const pdf = (res, buffer, name) => sendFile(res, buffer, name, "application/pdf");
const photoUpload = offlineUploader("assessors").single("photo");
const sheetUpload = offlineUploader("sheets").single("file");
// ** Excel imports are read in memory and never stored
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (/\.xlsx$/i.test(file.originalname) ? cb(null, true) : cb(new Error("upload the .xlsx template"), false)),
}).single("file");

// ---- partners
export const createTp = asyncHandler(async (req, res) => ok(res, await partners.createTp(req.body, req.user.id, ctx(req)), "training partner created", StatusCodes.CREATED));
export const listTps = asyncHandler(async (req, res) => ok(res, await partners.listTps()));
export const getTp = asyncHandler(async (req, res) => ok(res, await partners.getTp(req.params.id)));
export const updateTp = asyncHandler(async (req, res) => ok(res, await partners.updateTp(req.params.id, req.body, ctx(req)), "saved"));

// ---- assessors
export const listAssessors = asyncHandler(async (req, res) => ok(res, await partners.listAssessors()));
export const createAssessor = asyncHandler(async (req, res) => ok(res, await partners.createAssessor(req.body, req.user.id, ctx(req)), "assessor added", StatusCodes.CREATED));
export const updateAssessor = asyncHandler(async (req, res) => ok(res, await partners.updateAssessor(req.params.id, req.body, ctx(req)), "saved"));
export const uploadAssessorPhoto = asyncHandler(async (req, res) => {
  await partners.getAssessor(req.params.id);
  await runUpload(photoUpload, req, res);
  ok(res, await partners.setAssessorPhoto(req.params.id, req.file, ctx(req)), "photo uploaded");
});
export const assessorIdCard = asyncHandler(async (req, res) => {
  const assessor = await partners.getAssessor(req.params.id);
  pdf(res, await documents.idCard(assessor), `${assessor.assessorCode}-id-card.pdf`);
});
export const fileLink = asyncHandler(async (req, res) => ok(res, { url: await offlineSignedLink(req.query.key) }));

// ---- batches and candidates
export const listBatches = asyncHandler(async (req, res) => ok(res, await batches.list(req.query)));
export const createBatch = asyncHandler(async (req, res) => ok(res, await batches.create(req.body, req.user.id, ctx(req)), "batch created", StatusCodes.CREATED));
export const getBatch = asyncHandler(async (req, res) => {
  const batch = await batches.get(req.params.id);
  ok(res, { batch, candidates: await batches.candidates(batch._id), certificates: await documents.certificates(batch._id) });
});
export const updateBatch = asyncHandler(async (req, res) => ok(res, await batches.update(req.params.id, req.body, ctx(req)), "saved"));
export const deleteBatch = asyncHandler(async (req, res) => ok(res, await batches.remove(req.params.id, ctx(req)), "batch deleted"));
export const uploadSheet = asyncHandler(async (req, res) => {
  await batches.get(req.params.id);
  await runUpload(sheetUpload, req, res);
  ok(res, await batches.attachSheet(req.params.id, req.params.kind, req.file, ctx(req)), "uploaded");
});
export const addCandidate = asyncHandler(async (req, res) => ok(res, await batches.addCandidate(req.params.id, req.body, ctx(req)), "candidate added", StatusCodes.CREATED));
export const updateCandidate = asyncHandler(async (req, res) => ok(res, await batches.updateCandidate(req.params.id, req.params.candidateId, req.body, ctx(req)), "saved"));
export const deleteCandidate = asyncHandler(async (req, res) => ok(res, await batches.removeCandidate(req.params.id, req.params.candidateId, ctx(req)), "candidate removed"));
export const candidateTemplate = asyncHandler(async (req, res) => sendFile(res, await batches.candidateTemplate(), "candidates-template.xlsx", XLSX_TYPE));
export const importCandidates = asyncHandler(async (req, res) => {
  await runUpload(excelUpload, req, res);
  ok(res, await batches.importCandidates(req.params.id, req.file?.buffer, ctx(req)), "candidates imported");
});
export const saveResults = asyncHandler(async (req, res) => ok(res, await batches.saveResults(req.params.id, req.body?.entries, ctx(req)), "results saved"));
export const resultTemplate = asyncHandler(async (req, res) => {
  const batch = await batches.get(req.params.id);
  sendFile(res, await batches.resultTemplate(req.params.id), `${batch.batchCode}-results.xlsx`, XLSX_TYPE);
});
export const importResults = asyncHandler(async (req, res) => {
  await runUpload(excelUpload, req, res);
  ok(res, await batches.importResults(req.params.id, req.file?.buffer, ctx(req)), "results imported");
});

// ---- documents
export const attendanceSheetPdf = asyncHandler(async (req, res) => {
  const { batch, pdf: buffer } = await documents.attendanceSheet(req.params.id);
  pdf(res, buffer, `${batch.batchCode}-attendance-sheet.pdf`);
});
export const resultSheetPdf = asyncHandler(async (req, res) => {
  const { batch, pdf: buffer } = await documents.resultSheet(req.params.id);
  pdf(res, buffer, `${batch.batchCode}-result-sheet.pdf`);
});
export const publishBatch = asyncHandler(async (req, res) => ok(res, await documents.publish(req.params.id, req.user.id, ctx(req)), "results published"));
export const allCertificatesPdf = asyncHandler(async (req, res) => {
  const { batch, pdf: buffer } = await documents.allCertificatesPdf(req.params.id);
  pdf(res, buffer, `${batch.batchCode}-certificates.pdf`);
});
export const certificatePdf = asyncHandler(async (req, res) => {
  const certificate = await documents.certificate(req.params.id);
  pdf(res, await documents.certificatePdf(certificate), `${certificate.snapshot.enrollmentNumber}-certificate.pdf`);
});
export const revokeCertificate = asyncHandler(async (req, res) => ok(res, await documents.revoke(req.params.id, req.body?.reason, ctx(req)), "certificate revoked"));

// ---- templates
export const listTemplates = asyncHandler(async (req, res) => ok(res, await documents.listTemplates(req.query)));
export const savedTemplates = asyncHandler(async (req, res) => ok(res, await documents.savedTemplates()));
export const saveTemplate = asyncHandler(async (req, res) => ok(res, await documents.saveTemplate(req.params.type, req.query, req.body?.html, req.user.id, ctx(req)), "template saved"));
export const resetTemplate = asyncHandler(async (req, res) => ok(res, await documents.resetTemplate(req.params.type, req.query, ctx(req)), "template removed"));
export const previewTemplate = asyncHandler(async (req, res) => pdf(res, await documents.previewTemplate(req.params.type, req.query, req.body?.html), `${req.params.type}-preview.pdf`));

// ---- public
export const verifyCertificate = asyncHandler(async (req, res) => ok(res, await documents.verify(req.params.code)));
