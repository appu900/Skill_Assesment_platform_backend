import express from "express";
import TrainingPartnerController from "../controller/TrainingPartner-controller.js";

const router = express.Router();

router.post("/create", TrainingPartnerController.createNewTrainingPartner);

router.get("/:id", TrainingPartnerController.getTrainingPartner);
router.get("/all", TrainingPartnerController.getAllTrainingPartners);
router.put("/:id", TrainingPartnerController.updateTrainingPartner);
router.delete("/:id", TrainingPartnerController.deleteTrainingPartner);

export default router;
