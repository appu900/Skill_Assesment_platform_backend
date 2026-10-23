import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  createMark,
  getBatchMarkData,
  getIndividualStudentMarks,
} from "../../controller/marks-upload-controller.js";

const router = express.Router();

router.post("/upload", allow(ROLES.ASSESMENT_AGENCY, ROLES.ADMIN), createMark);
router.get("/student/:id", allow(), getIndividualStudentMarks);
router.get("/batch/:id", allow(), getBatchMarkData);

export default router;
