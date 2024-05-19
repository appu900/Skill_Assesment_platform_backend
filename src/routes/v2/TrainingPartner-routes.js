import express from "express";
import TrainingPartnerController from "../../controller/TrainingPartner-controller.js";

const router = express.Router();

router.post("/trainingpartner",TrainingPartnerController.createNewTrainingPartner);
router.post("/trainingpartner/login", TrainingPartnerController.login);


export default router;