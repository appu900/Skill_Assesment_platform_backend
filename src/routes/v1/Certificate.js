

import express from 'express';
import { publishCertificate } from '../../controller/exam-controller.js';
import { getAllStudentCertificate, getAStudentCertificate } from '../../controller/Batch-controller.js';


const router = express.Router();

router.post("/publish/exam/:id",publishCertificate)
router.get("/batch/:id",getAllStudentCertificate)
router.get("/student/:studentId",getAStudentCertificate)

export default router;