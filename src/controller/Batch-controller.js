import upload from "../config/s3-imageUpload-config.js";
import BatchService from "../service/Batch-service.js";
import { StatusCodes } from "http-status-codes";
import CertificateService from "../service/CertificateService.js";

const batchService = new BatchService();
const certificateService = new CertificateService();

const uploadFiles = upload.fields([
  { name: "preInvoice", maxCount: 1 },
  { name: "postInvoice", maxCount: 1 },
]);

const createBatch = async (req, res) => {
  try {
    const payload = req.body;
    payload.trainingOrganizationId = req.trainingPartnerId;
    const batch = await batchService.createBatch(payload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: batch,
      message: "batch created sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const addStudentToBatch = async (req, res) => {
  try {
    const studentPayload = req.body;
    const batchId = req.params.id;
    studentPayload.trainingPartner = req.trainingPartnerId;
    const student = await batchService.addStudent(batchId, studentPayload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: student,
      message: "added new student to batch",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      sucess: false,
      error: error.messaage,
      message: "something went wrong",
    });
  }
};

const addToTrainerToBatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    const trainerPayload = req.body;
    trainerPayload.trainingPartner = req.trainingPartnerId;
    const trainer = await batchService.addTrainerTobatch(
      batchId,
      trainerPayload
    );
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: trainer,
      message: "trainer added sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      sucess: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getBatchDetails = async (req, res) => {
  try {
    const response = await batchService.getBatchData(req.params.id);
    return res.status(StatusCodes.OK).json({
      sucess: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      sucess: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getIndividualTrainingPartnerBatchDetails = async (req, res) => {
  try {
    const trainingPartnerId = req.params.trainingPartnerId;
    const response = await batchService.getBatchesOfTrainingPartner(
      trainingPartnerId
    );
    return res.status(StatusCodes.OK).json({
      message: "data fethed sucessfully",
      success: true,
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

const getAllBatchData = async (req, res) => {
  try {
    const response = await batchService.getAllBatces();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "all batches data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.OK).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getFilteredBatchData = async (req, res) => {
  try {
    const response = await batchService.filterQueryData(req.query);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "filtered data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const bulkTrainersInsertInBatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    const trainersData = req.body.trainerIds;
    const response = await batchService.bulkTeacherInsert(
      batchId,
      trainersData
    );

    return res.status(StatusCodes.ACCEPTED).json({
      success: true,
      message: "trainers inserted sucessfully",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const activeBatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    const response = await batchService.activeBatch(batchId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "batch submission done sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const addBatchPaymentAmount = async (req, res) => {
  try {
    const batchId = req.params.id;
    const amount = req.body.amount;
    const response = await batchService.addPaymentCorporatePayment(
      batchId,
      amount
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "payment added successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const uploadBatchPaymentDetails = async (req, res) => {
  try {
    uploadFiles(req, res, async function (err) {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: err.message,
          message: "something went wrong",
        });
      }
      const preInvoiceUrl = req.files.preInvoice[0].location;
      const postInvoiceUrl = req.files.postInvoice[0].location;
      console.log(preInvoiceUrl, postInvoiceUrl);
      const batchId = req.params.id;
      const transactionId = req.body.transactionId;

      const response = await batchService.updateClientPaymentDetails(
        batchId,
        preInvoiceUrl,
        postInvoiceUrl,
        transactionId
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: response,
        message: "payment details uploaded successfully",
      });
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getAllBatchPaymentNotification = async (req, res) => {
  try {
    const response = await batchService.getAllPaymentNotifications();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "all payment notification fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getAllCorporatePaymentBatch = async (req, res) => {
  try {
    const response = await batchService.getBatchByCorporatePayment();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "all corporate payment batch fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const updateBatchPaymentStatus = async (req, res) => {
  try {
    const response = await batchService.updateFinalPaymentStatus(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "payment status updated successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getAllStudentCertificate = async (req, res) => {
  try {
    const batchId = req.params.id;
    const response = await certificateService.getAllCertificates(batchId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "all certificates fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getPaymentApprovalForGovernemtBatches = async (req, res) => {
  try {
    const response =
      await batchService.getAllGovernmentBatchesForPaymentApproval();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "all government batches fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getAllGovernmentBatchesStateAndScehmeWise = async (req, res) => {
  try {
    const response = await batchService.filterStateWiseAndScehemWiseData(
      req.query
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "all government batches fetched successfully",
    });
  } catch (error) {
    return req.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getAllBatchesBySchemeName = async (req, res) => {
  try {
    const payload = req.query.scheme;
    const state = req.query.state;
    if(!state || !payload){
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "state and scheme are required",
      });
    }
    const response = await batchService.getAllBatchesBySchemeName(payload,state);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "all batches fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

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
  getAllBatchesBySchemeName
};
