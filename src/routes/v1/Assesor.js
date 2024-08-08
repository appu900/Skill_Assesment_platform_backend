
import express from "express";
import { createAssessor, getAllAssesor, uploadAssesorMarkSheet } from "../../controller/Assessor-controller.js";
import uploadImage from "../../middleware/imageUpload.js";
const router = express.Router();


router.post("/", uploadImage, createAssessor);
router.put("/marksheet/:id",uploadAssesorMarkSheet)
router.get("/aa/:id",getAllAssesor)  

export default router;