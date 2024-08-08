

import express from 'express';
import { publishCertificate } from '../../controller/exam-controller.js';
import { getAllStudentCertificate } from '../../controller/Batch-controller.js';


const router = express.Router();

router.post("/publish/exam/:id",publishCertificate)
router.post("/batch/:id",getAllStudentCertificate)

export default router;