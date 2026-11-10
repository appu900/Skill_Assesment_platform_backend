import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  getCertificatePublishStatus,
  publishCertificate,
} from "../../controller/exam-controller.js";
import { batchCertificatesPdf, certificatePdf } from "../../controller/Certificate-format-controller.js";
import {
  getAllStudentCertificate,
  getAStudentCertificate,
} from "../../controller/Batch-controller.js";

const router = express.Router();

router.post("/publish/exam/:id", allow(ROLES.ADMIN), publishCertificate);
router.get("/publish/exam/:id/status", allow(ROLES.ADMIN, ROLES.LCRC), getCertificatePublishStatus);
router.get("/batch/:id/pdf", allow(ROLES.ADMIN, ROLES.TRAINING_PARTNER, ROLES.SNA, ROLES.LCRC), batchCertificatesPdf);
router.get("/batch/:id", allow(), getAllStudentCertificate);
router.get("/:id/pdf", allow(ROLES.ADMIN, ROLES.TRAINING_PARTNER, ROLES.SNA, ROLES.LCRC), certificatePdf);
router.get("/student/:studentId", allow(), getAStudentCertificate);

export default router;
