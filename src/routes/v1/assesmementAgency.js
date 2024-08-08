import express from "express";
import verifyIsAdmin from "../../middleware/verifyAdmin.js";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
import verifyAssesmentAgency from "../../middleware/verifyAssesmentAgency.js";
import { assesmentAgencylogin, createAssesmentAgency, filterAssesmentgency, getAllApprovedAssesmentAgency, getAllAssesmentAgency, getAllPendingAssesmentAgency, getAssesmentAgencyById, updateAssesmentAgencyStatusToApproved, updateAssesmentAgencyStatusToRejected, updateBankDetails } from "../../controller/Assesment-agency-controller.js";

const router = express.Router();

router.post("/create", createAssesmentAgency);
router.post("/login", assesmentAgencylogin);
router.put(
  "/approve/:id",
  verifyIsAdmin,
  updateAssesmentAgencyStatusToApproved
);
router.put("/reject/:id", verifyIsAdmin, updateAssesmentAgencyStatusToRejected);

router.get("/:id", getAssesmentAgencyById);
router.get("/", getAllAssesmentAgency);
router.get("/status/approved", getAllApprovedAssesmentAgency);
router.get("/status/pending", getAllPendingAssesmentAgency);
router.get("/all/query", filterAssesmentgency);
router.put("/bdt/:id", updateBankDetails);

export default router;
