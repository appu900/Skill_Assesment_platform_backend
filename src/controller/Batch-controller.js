import { StatusCodes } from "http-status-codes";
import upload from "../config/s3-imageUpload-config.js";
import BatchService from "../service/Batch-service.js";
import CertificateService from "../service/CertificateService.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";
import AppError from "../utils/AppError.js";
import { getPagination } from "../utils/pagination.js";

const batchService = new BatchService();
const certificateService = new CertificateService();

const uploadFiles = upload.fields([
  { name: "preInvoice", maxCount: 1 },
  { name: "postInvoice", maxCount: 1 },
]);

const createBatch = asyncHandler(async (req, res) => {
  const batch = await batchService.createBatch(req.body, req.user.id);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: batch,
    message: "batch created sucessfully",
  });
});

const addStudentToBatch = asyncHandler(async (req, res) => {
  const student = await batchService.addStudent(req.params.id, req.body, req.user);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: student,
    message: "added new student to batch",
  });
});

const addToTrainerToBatch = asyncHandler(async (req, res) => {
  const trainer = await batchService.addTrainerTobatch(req.params.id, req.body, req.user);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: trainer,
    message: "trainer added sucessfully",
  });
});

const getBatchDetails = asyncHandler(async (req, res) => {
  const response = await batchService.getBatchData(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const getIndividualTrainingPartnerBatchDetails = asyncHandler(async (req, res) => {
  const response = await batchService.getBatchesOfTrainingPartner(req.params.trainingPartnerId);
  return res.status(StatusCodes.OK).json({
    message: "data fethed sucessfully",
    success: true,
    data: response,
  });
});

const getAllBatchData = asyncHandler(async (req, res) => {
  const response = await batchService.getAllBatces(getPagination(req.query));
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "all batches data fetched sucessfully",
  });
});

const getFilteredBatchData = asyncHandler(async (req, res) => {
  const response = await batchService.filterQueryData(req.query);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "filtered data fetched sucessfully",
  });
});

const bulkTrainersInsertInBatch = asyncHandler(async (req, res) => {
  const response = await batchService.bulkTeacherInsert(
    req.params.id,
    req.body.trainerIds,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "trainers inserted sucessfully",
    data: response,
  });
});

const activeBatch = asyncHandler(async (req, res) => {
  const response = await batchService.activeBatch(req.params.id, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "batch submission done sucessfully",
  });
});

const addBatchPaymentAmount = asyncHandler(async (req, res) => {
  const response = await batchService.addPaymentCorporatePayment(req.params.id, req.body.amount);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "payment added successfully",
  });
});

const uploadBatchPaymentDetails = asyncHandler(async (req, res) => {
  await runUpload(uploadFiles, req, res);
  const preInvoiceUrl = req.files?.preInvoice?.[0]?.location;
  const postInvoiceUrl = req.files?.postInvoice?.[0]?.location;
  if (!preInvoiceUrl || !postInvoiceUrl) {
    throw new AppError("preInvoice and postInvoice files are required");
  }
  if (!req.body.transactionId) {
    throw new AppError("transactionId is required");
  }
  const response = await batchService.updateClientPaymentDetails(
    req.params.id,
    preInvoiceUrl,
    postInvoiceUrl,
    req.body.transactionId,
    req.body.paymentPublishedBy,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "payment details uploaded successfully",
  });
});

const getAllBatchPaymentNotification = asyncHandler(async (req, res) => {
  const response = await batchService.getAllPaymentNotifications();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "all payment notification fetched successfully",
  });
});

const getAllCorporatePaymentBatch = asyncHandler(async (req, res) => {
  const response = await batchService.getBatchByCorporatePayment();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "all corporate payment batch fetched successfully",
  });
});

const updateBatchPaymentStatus = asyncHandler(async (req, res) => {
  const response = await batchService.updateFinalPaymentStatus(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "payment status updated successfully",
  });
});

const getAllStudentCertificate = asyncHandler(async (req, res) => {
  const response = await certificateService.getAllCertificates(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "all certificates fetched successfully",
  });
});

const getAStudentCertificate = asyncHandler(async (req, res) => {
  const studentCertificate = await certificateService.getASpecificStudnetCertificate(
    req.params.studentId
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: studentCertificate,
    message: "certificate data fethed sucessfully",
  });
});

const getPaymentApprovalForGovernemtBatches = asyncHandler(async (req, res) => {
  const response = await batchService.getAllGovernmentBatchesForPaymentApproval();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "all government batches fetched successfully",
  });
});

const getAllGovernmentBatchesStateAndScehmeWise = asyncHandler(async (req, res) => {
  const response = await batchService.filterStateWiseAndScehemWiseData(req.query, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "all government batches fetched successfully",
  });
});

const getAllBatchesBySchemeName = asyncHandler(async (req, res) => {
  const { scheme, state } = req.query;
  if ((!state || !scheme) && req.user.role !== "SNA") {
    throw new AppError("state and scheme are required");
  }
  const response = await batchService.getAllBatchesBySchemeName(scheme, state, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "all batches fetched successfully",
  });
});

export {
  createBatch,
  addStudentToBatch,
  addToTrainerToBatch,
  getBatchDetails,
  getIndividualTrainingPartnerBatchDetails,
  getAllBatchData,
  getFilteredBatchData,
  bulkTrainersInsertInBatch,
  activeBatch,
  addBatchPaymentAmount,
  uploadBatchPaymentDetails,
  getAllBatchPaymentNotification,
  getAllCorporatePaymentBatch,
  updateBatchPaymentStatus,
  getAllStudentCertificate,
  getPaymentApprovalForGovernemtBatches,
  getAllGovernmentBatchesStateAndScehmeWise,
  getAllBatchesBySchemeName,
  getAStudentCertificate,
};
