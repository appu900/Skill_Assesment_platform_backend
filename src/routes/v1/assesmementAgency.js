import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import { loginLimiter } from "../../middleware/rateLimiter.js";
import {
  assesmentAgencylogin,
  createAssesmentAgency,
  filterAssesmentgency,
  getAllApprovedAssesmentAgency,
  getAllAssesmentAgency,
  getAllPendingAssesmentAgency,
  getAssesmentAgencyById,
  updateAssesmentAgencyStatusToApproved,
  updateAssesmentAgencyStatusToRejected,
  updateBankDetails,
} from "../../controller/Assesment-agency-controller.js";

const router = express.Router();
const { ADMIN, ASSESMENT_AGENCY } = ROLES;

router.post("/create", createAssesmentAgency);
router.post("/login", loginLimiter, assesmentAgencylogin);

router.put("/approve/:id", allow(ADMIN), updateAssesmentAgencyStatusToApproved);
router.put("/reject/:id", allow(ADMIN), updateAssesmentAgencyStatusToRejected);
router.put("/bdt/:id", allow(ADMIN, ASSESMENT_AGENCY), updateBankDetails);

router.get("/status/approved", allow(), getAllApprovedAssesmentAgency);
router.get("/status/pending", allow(), getAllPendingAssesmentAgency);
router.get("/all/query", allow(), filterAssesmentgency);
router.get("/:id", allow(), getAssesmentAgencyById);
router.get("/", allow(), getAllAssesmentAgency);

export default router;
