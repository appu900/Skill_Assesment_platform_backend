import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  createTrainer,
  deleteTrainer,
  getAllTrainers,
  getAllTrainersOfaTrainingPartner,
  getTrainerById,
  uploadTrainerResultSheet,
} from "../../controller/Trainer-controller.js";

const router = express.Router();
const { ADMIN, TRAINING_PARTNER } = ROLES;

router.post("/", allow(TRAINING_PARTNER), createTrainer);
router.delete("/:id", allow(TRAINING_PARTNER, ADMIN), deleteTrainer);
router.put("/marksheet/:id", allow(TRAINING_PARTNER, ADMIN), uploadTrainerResultSheet);
router.get("/tp/:id", allow(), getAllTrainersOfaTrainingPartner);
router.get("/:id", allow(), getTrainerById);
router.get("/", allow(), getAllTrainers);

export default router;
