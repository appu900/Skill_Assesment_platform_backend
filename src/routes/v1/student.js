import express from "express";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
import { createStudent, getStudentCertificateByStudentenrollementId, getStudentDetails, markStudentAbsent, updateProfilePic } from "../../controller/Student-controller.js";

const router = express.Router();

router.post("/", verifyIsTrainingPartner, createStudent);
router.get("/:id", getStudentDetails);
router.put("/profile/:id", updateProfilePic);
router.put("/absent/:id", markStudentAbsent);
router.post("/c/a", getStudentCertificateByStudentenrollementId);

export default router;
