import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  getCertificatePublishStatus,
  publishCertificate,
} from "../../controller/exam-controller.js";
import {
  getAllStudentCertificate,
  getAStudentCertificate,
} from "../../controller/Batch-controller.js";

const router = express.Router();

router.post("/publish/exam/:id", allow(ROLES.ADMIN), publishCertificate);
router.get("/publish/exam/:id/status", allow(ROLES.ADMIN), getCertificatePublishStatus);
router.get("/batch/:id", allow(), getAllStudentCertificate);
router.get("/student/:studentId", allow(), getAStudentCertificate);

export default router;
