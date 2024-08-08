
import express from "express";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
import { createTrainer, deleteTrainer, getAllTrainers, getAllTrainersOfaTrainingPartner, getTrainerById, uploadTrainerResultSheet } from "../../controller/Trainer-controller.js";

const router = express.Router();


router.post("/", verifyIsTrainingPartner, createTrainer);
router.get("/", getAllTrainers);
router.get("/:id", getTrainerById);
router.delete("/:id", deleteTrainer);
router.get("/tp/:id", getAllTrainersOfaTrainingPartner);
router.put("/marksheet/:id",uploadTrainerResultSheet)


export default router;