import express from "express";
import TrainingPartnerController from "../../controller/TrainingPartner-controller.js";
import { allow, ROLES } from "../../middleware/auth.js";
import { loginLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();
const { ADMIN, TRAINING_PARTNER } = ROLES;

// ** public
router.post("/", TrainingPartnerController.onBoardTrainingPartner);
router.post("/login", loginLimiter, TrainingPartnerController.login);

// ** training partner (own record) or admin
router.put("/info/email/:id", allow(ADMIN, TRAINING_PARTNER), TrainingPartnerController.updateEmail);
router.put("/sectors/:id", allow(ADMIN, TRAINING_PARTNER), TrainingPartnerController.updateSector);
router.put("/courses/:id", allow(ADMIN, TRAINING_PARTNER), TrainingPartnerController.updateCourses);

// ** any logged in user
router.get("/all/query", allow(), TrainingPartnerController.filterTrainingPartnerData);
router.get("/status/pending", allow(), TrainingPartnerController.getNewTrainingPartnerApplications);
router.get("/status/approved", allow(), TrainingPartnerController.getApprovedTrainingPartnerData);
router.get("/:id", allow(), TrainingPartnerController.getTrainingPartnerById);
router.get("/", allow(), TrainingPartnerController.getAllData);

// ** admin only
router.put("/approve/:id", allow(ADMIN), TrainingPartnerController.updateStatusToApproved);
router.put("/reject/:id", allow(ADMIN), TrainingPartnerController.updateStatusToRejected);

router.put("/:id", allow(ADMIN, TRAINING_PARTNER), TrainingPartnerController.updateTrainingPartnerStatus);

export default router;
