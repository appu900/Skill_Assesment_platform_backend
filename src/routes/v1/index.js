import express from "express";

import AdminController from "../../controller/Admin-controller.js";
import TrainingPartnerController from "../../controller/TrainingPartner-controller.js";

const router = express.Router();

// ** Admin
router.post("/admin", AdminController.createNewAdmin);
router.post("/admin/login", AdminController.login);

// ** TP
router.post("/tp", TrainingPartnerController.onBoardTrainingPartner);
router.get("/tp/:id", TrainingPartnerController.getTrainingPartnerById);
router.get("/tp", TrainingPartnerController.getAllData);
router.put("/tp/:id", TrainingPartnerController.updateTrainingPartnerStatus);
router.put("/tp/approve/:id",TrainingPartnerController.updateStatusToApproved)
router.put("/tp/reject/:id",TrainingPartnerController.updateStatusToRejected)


export default router;
