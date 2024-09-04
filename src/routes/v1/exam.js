
import express from "express";
import verifyAssesmentAgency from "../../middleware/verifyAssesmentAgency.js";
import verifyIsAdmin from "../../middleware/verifyAdmin.js";
import { addAssesmentDate, assignAnExam, assignAssesorToExam, changeExamCompleteStatus, fetchAExamDetails, getALlExams, getALLExamsBelongsToAnAssesmentAgency, getAttendanceSheetForExam, updateExamPaymentStatus, updateStudentAttendanceNumber, uploadPhotos } from "../../controller/exam-controller.js";
const router = express.Router();

router.post("/create", verifyIsAdmin, assignAnExam);
router.get("/all", getALlExams);
router.get("/aa/:id", getALLExamsBelongsToAnAssesmentAgency);
router.put("/addassessor/:id",assignAssesorToExam)
router.put("/status/:id",changeExamCompleteStatus)
router.put("/images/:id",uploadPhotos)
router.get("/:id",fetchAExamDetails)
router.get("/attendance/:id",getAttendanceSheetForExam)
router.put("/assesmentdate/:id",addAssesmentDate)
router.put("/paymentstatus/:id",updateExamPaymentStatus)
router.put("/attendance/:id",updateStudentAttendanceNumber)

export default router;