import express from "express";
import { createMark, getBatchMarkData, getIndividualStudentMarks, getStudentMarksByBatchId } from "../../controller/marks-upload-controller.js";

const router = express.Router();

router.post("/upload", createMark);
router.get("/student/:id", getIndividualStudentMarks);
// router.get("/batch/:id", getStudentMarksByBatchId);
router.get("/batch/:id",getBatchMarkData)

export default router;