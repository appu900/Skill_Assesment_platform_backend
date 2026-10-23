import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  activeBatch,
  addBatchPaymentAmount,
  addStudentToBatch,
  addToTrainerToBatch,
  bulkTrainersInsertInBatch,
  createBatch,
  getAllBatchData,
  getAllBatchPaymentNotification,
  getAllCorporatePaymentBatch,
  getBatchDetails,
  getFilteredBatchData,
  getIndividualTrainingPartnerBatchDetails,
  getPaymentApprovalForGovernemtBatches,
  updateBatchPaymentStatus,
  uploadBatchPaymentDetails,
} from "../../controller/Batch-controller.js";

const router = express.Router();
const { ADMIN, TRAINING_PARTNER } = ROLES;

// ** training partner (own batches)
router.post("/create", allow(TRAINING_PARTNER), createBatch);
router.post("/addstudent/:id", allow(TRAINING_PARTNER), addStudentToBatch);
router.post("/addtrainer/:id", allow(TRAINING_PARTNER), addToTrainerToBatch);
router.post("/bulkaddTrainer/:id", allow(TRAINING_PARTNER, ADMIN), bulkTrainersInsertInBatch);
router.put("/active/:id", allow(TRAINING_PARTNER), activeBatch);
router.put("/paymentdetails/:id", allow(TRAINING_PARTNER), uploadBatchPaymentDetails);

// ** admin
router.put("/addpayment/:id", allow(ADMIN), addBatchPaymentAmount);
router.put("/paymentstatus/:id", allow(ADMIN), updateBatchPaymentStatus);
router.get("/all/paymentnotification", allow(ADMIN), getAllBatchPaymentNotification);
router.get("/all/corporate", allow(ADMIN), getAllCorporatePaymentBatch);
router.get("/all/payment/gov", allow(ADMIN), getPaymentApprovalForGovernemtBatches);

// ** any logged in user
router.get("/all/query", allow(), getFilteredBatchData);
router.get("/tp/:trainingPartnerId", allow(), getIndividualTrainingPartnerBatchDetails);
router.get("/:id", allow(), getBatchDetails);
router.get("/", allow(), getAllBatchData);

export default router;
