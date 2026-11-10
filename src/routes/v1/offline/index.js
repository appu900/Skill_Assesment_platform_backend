import express from "express";
import { allow, ROLES } from "../../../middleware/auth.js";
import * as offline from "../../../controller/offline/Offline-controller.js";

// ** offline wing: partners that never log in; CUTM enters their batches and acts as the assessment agency
const router = express.Router();

router.get("/public/verify/:code", offline.verifyCertificate);

const m = express.Router();
m.use(allow(ROLES.ADMIN));
m.get("/tps", offline.listTps);
m.post("/tps", offline.createTp);
m.get("/tps/:id", offline.getTp);
m.put("/tps/:id", offline.updateTp);

m.get("/assessors", offline.listAssessors);
m.post("/assessors", offline.createAssessor);
m.put("/assessors/:id", offline.updateAssessor);
m.put("/assessors/:id/photo", offline.uploadAssessorPhoto);
m.get("/assessors/:id/id-card.pdf", offline.assessorIdCard);
m.get("/files", offline.fileLink);

m.get("/batches", offline.listBatches);
m.post("/batches", offline.createBatch);
m.get("/candidates-template.xlsx", offline.candidateTemplate);
m.get("/batches/:id", offline.getBatch);
m.put("/batches/:id", offline.updateBatch);
m.delete("/batches/:id", offline.deleteBatch);
m.put("/batches/:id/sheets/:kind(attendance|result)", offline.uploadSheet);
m.post("/batches/:id/candidates", offline.addCandidate);
m.post("/batches/:id/candidates/import", offline.importCandidates);
m.put("/batches/:id/candidates/:candidateId", offline.updateCandidate);
m.delete("/batches/:id/candidates/:candidateId", offline.deleteCandidate);
m.put("/batches/:id/results", offline.saveResults);
m.get("/batches/:id/results-template.xlsx", offline.resultTemplate);
m.post("/batches/:id/results/import", offline.importResults);
m.get("/batches/:id/attendance-sheet.pdf", offline.attendanceSheetPdf);
m.get("/batches/:id/result-sheet.pdf", offline.resultSheetPdf);
m.put("/batches/:id/publish", offline.publishBatch);
m.get("/batches/:id/certificates.pdf", offline.allCertificatesPdf);
m.get("/certificates/:id/pdf", offline.certificatePdf);
m.put("/certificates/:id/revoke", offline.revokeCertificate);

m.get("/templates", offline.listTemplates);
m.get("/templates/saved", offline.savedTemplates);
m.put("/templates/:type", offline.saveTemplate);
m.delete("/templates/:type", offline.resetTemplate);
m.post("/templates/:type/preview", offline.previewTemplate);
router.use("/admin", m);

export default router;
