import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  addAssesmentDate,
  assignAnExam,
  assignAssesorToExam,
  changeExamCompleteStatus,
  fetchAExamDetails,
  getALlExams,
  getALLExamsBelongsToAnAssesmentAgency,
  getAttendanceSheetForExam,
  updateExamPaymentStatus,
  updateStudentAttendanceNumber,
  uploadPhotos,
} from "../../controller/exam-controller.js";

const router = express.Router();
const { ADMIN, ASSESMENT_AGENCY } = ROLES;

// ** admin
router.post("/create", allow(ADMIN), assignAnExam);
router.put("/paymentstatus/:id", allow(ADMIN), updateExamPaymentStatus);

// ** assesment agency of the exam (or admin)
router.put("/addassessor/:id", allow(ASSESMENT_AGENCY, ADMIN), assignAssesorToExam);
router.put("/status/:id", allow(ASSESMENT_AGENCY, ADMIN), changeExamCompleteStatus);
router.put("/images/:id", allow(ASSESMENT_AGENCY, ADMIN), uploadPhotos);
router.put("/assesmentdate/:id", allow(ASSESMENT_AGENCY, ADMIN), addAssesmentDate);
router.put("/attendance/:id", allow(ASSESMENT_AGENCY, ADMIN), updateStudentAttendanceNumber);

// ** any logged in user
router.get("/all", allow(), getALlExams);
router.get("/aa/:id", allow(), getALLExamsBelongsToAnAssesmentAgency);
router.get("/attendance/:id", allow(), getAttendanceSheetForExam);
router.get("/:id", allow(), fetchAExamDetails);

export default router;
