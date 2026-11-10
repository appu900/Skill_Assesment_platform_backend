import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  getAdminAnalytics,
  getAgencyAnalytics,
  getLcrcAnalytics,
  getSnaAnalytics,
  getTrainingPartnerAnalytics,
} from "../../controller/Analytics-controller.js";

const router = express.Router();

// ** dashboard numbers and charts, one endpoint per portal
router.get("/admin", allow(ROLES.ADMIN), getAdminAnalytics);
router.get("/tp", allow(ROLES.TRAINING_PARTNER), getTrainingPartnerAnalytics);
router.get("/sna", allow(ROLES.SNA), getSnaAnalytics);
router.get("/aa", allow(ROLES.ASSESMENT_AGENCY), getAgencyAnalytics);
router.get("/lcrc", allow(ROLES.LCRC, ROLES.ADMIN), getLcrcAnalytics);

export default router;
