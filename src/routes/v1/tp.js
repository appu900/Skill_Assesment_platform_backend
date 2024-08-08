import express from "express";
import TrainingPartnerController from "../../controller/TrainingPartner-controller.js";
import verifyIsAdmin from "../../middleware/verifyAdmin.js";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
const router = express.Router();


// ** TP
router.post("/", TrainingPartnerController.onBoardTrainingPartner);
router.post("/login", TrainingPartnerController.login);

router.put("/info/email/:id", TrainingPartnerController.updateEmail);
router.put("/sectors/:id", TrainingPartnerController.updateSector);
router.put("/courses/:id", TrainingPartnerController.updateCourses);

router.get("/:id", TrainingPartnerController.getTrainingPartnerById);
router.get("/", TrainingPartnerController.getAllData);

router.get("/all/query", TrainingPartnerController.filterTrainingPartnerData);

router.get(
  "/status/pending",
  TrainingPartnerController.getNewTrainingPartnerApplications
);
router.get(
  "/status/approved",
  TrainingPartnerController.getApprovedTrainingPartnerData
);

router.put("/:id", TrainingPartnerController.updateTrainingPartnerStatus);
router.put(
  "/approve/:id",
  verifyIsAdmin,
  TrainingPartnerController.updateStatusToApproved
);
router.put("/reject/:id", TrainingPartnerController.updateStatusToRejected);

export default router;