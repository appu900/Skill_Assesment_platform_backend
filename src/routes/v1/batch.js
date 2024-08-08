import express from "express";
import verifyAssesmentAgency from "../../middleware/verifyAssesmentAgency.js";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
import verifyIsAdmin from "../../middleware/verifyAdmin.js";
import { activeBatch, addBatchPaymentAmount, addStudentToBatch, addToTrainerToBatch, bulkTrainersInsertInBatch, createBatch, getAllBatchData, getAllBatchPaymentNotification, getAllCorporatePaymentBatch, getBatchDetails, getFilteredBatchData, getIndividualTrainingPartnerBatchDetails, getPaymentApprovalForGovernemtBatches, updateBatchPaymentStatus, uploadBatchPaymentDetails } from "../../controller/Batch-controller.js";

const router = express.Router();

router.post("/create", verifyIsTrainingPartner, createBatch);

router.post("/addstudent/:id", verifyIsTrainingPartner, addStudentToBatch);
router.post("/addtrainer/:id", verifyIsTrainingPartner, addToTrainerToBatch);

router.post("/bulkaddTrainer/:id", bulkTrainersInsertInBatch);

router.get("/:id", getBatchDetails);
router.get("/tp/:trainingPartnerId", getIndividualTrainingPartnerBatchDetails);
router.get("/", getAllBatchData);
router.get("/all/query", getFilteredBatchData);
router.get("/all/paymentnotification", getAllBatchPaymentNotification);
router.get("/all/corporate", getAllCorporatePaymentBatch);
router.get("/all/payment/gov", getPaymentApprovalForGovernemtBatches);

router.put("/active/:id", activeBatch);
router.put("/addpayment/:id", addBatchPaymentAmount);
router.put("/paymentdetails/:id", uploadBatchPaymentDetails);
router.put("/paymentstatus/:id", updateBatchPaymentStatus);

export default router;
