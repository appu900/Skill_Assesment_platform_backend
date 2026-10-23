import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  createStudent,
  getStudentCertificateByStudentenrollementId,
  getStudentDetails,
  markStudentAbsent,
  updateProfilePic,
} from "../../controller/Student-controller.js";

const router = express.Router();
const { ADMIN, TRAINING_PARTNER, ASSESMENT_AGENCY } = ROLES;

// ** public certificate verification
router.post("/c/a", getStudentCertificateByStudentenrollementId);

router.post("/", allow(TRAINING_PARTNER), createStudent);
router.put("/profile/:id", allow(TRAINING_PARTNER, ADMIN), updateProfilePic);
router.put("/absent/:id", allow(ASSESMENT_AGENCY, ADMIN), markStudentAbsent);
router.get("/:id", allow(), getStudentDetails);

export default router;
