import BatchService from "../service/Batch-service.js";
import { StatusCodes } from "http-status-codes";

const batchService = new BatchService();

const createBatch = async (req, res) => {
  try {
    const payload = req.body;
    payload.createdBy = req.trainingPartnerId;
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
    const response = await batchService.getBatchesOfTrainingPartner(trainingPartnerId)
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



export {
  createBatch,
  addStudentToBatch,
  addToTrainerToBatch,
  getBatchDetails,
  getIndividualTrainingPartnerBatchDetails,
};




