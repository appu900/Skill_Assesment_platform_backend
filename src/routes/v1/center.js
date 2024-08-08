import express from 'express';
import verifyIsTrainingPartner from '../../middleware/verifyTrainingPartner.js';
import { createCenter, getAllCentersOfTrainingPartner, updateCenterData } from '../../controller/CenterController.js';

const router = express.Router();

router.post("/",verifyIsTrainingPartner,createCenter);
router.get("/tp/:id",getAllCentersOfTrainingPartner)
router.put("/update/:id",verifyIsTrainingPartner,updateCenterData)

export default router;