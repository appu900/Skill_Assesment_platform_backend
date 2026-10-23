import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  createCenter,
  getAllCenterBySchemeNameAndState,
  getAllCentersOfTrainingPartner,
  getCenterDetails,
  updateCenterData,
} from "../../controller/CenterController.js";

const router = express.Router();
const { ADMIN, TRAINING_PARTNER } = ROLES;

router.post("/", allow(TRAINING_PARTNER), createCenter);
router.put("/update/:id", allow(TRAINING_PARTNER, ADMIN), updateCenterData);
router.get("/tp/:id", allow(), getAllCentersOfTrainingPartner);
router.get("/sna/query", allow(), getAllCenterBySchemeNameAndState);
router.get("/:centerId", allow(), getCenterDetails);

export default router;
