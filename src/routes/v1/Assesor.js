import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import uploadImage from "../../middleware/imageUpload.js";
import {
  createAssessor,
  getAllAssesor,
  uploadAssesorMarkSheet,
} from "../../controller/Assessor-controller.js";

const router = express.Router();
const { ADMIN, ASSESMENT_AGENCY } = ROLES;

router.post("/", allow(ASSESMENT_AGENCY, ADMIN), uploadImage, createAssessor);
router.put("/marksheet/:id", allow(ASSESMENT_AGENCY, ADMIN), uploadAssesorMarkSheet);
router.get("/aa/:id", allow(), getAllAssesor);

export default router;
