import express from "express";

import AdminController from "../../controller/Admin-controller.js";
import TrainingPartnerController from "../../controller/TrainingPartner-controller.js";
import verifyIsAdmin from "../../middleware/verifyAdmin.js";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
import { createTrainer } from "../../controller/Trainer-controller.js";

const router = express.Router();

// ** Admin
router.post("/admin", AdminController.createNewAdmin);
router.post("/admin/login", AdminController.login);

// ** TP
router.post("/tp", TrainingPartnerController.onBoardTrainingPartner);
router.post("/tp/login", TrainingPartnerController.login);

router.get("/tp/:id", TrainingPartnerController.getTrainingPartnerById);
router.get("/tp", TrainingPartnerController.getAllData);

router.put("/tp/:id", TrainingPartnerController.updateTrainingPartnerStatus);
router.put(
  "/tp/approve/:id",
  verifyIsAdmin,
  TrainingPartnerController.updateStatusToApproved
);
router.put("/tp/reject/:id", TrainingPartnerController.updateStatusToRejected);

// ** trainer

router.post("/trainer", verifyIsTrainingPartner,createTrainer);

export default router;







