import { StatusCodes } from "http-status-codes";
import upload from "../config/s3-imageUpload-config.js";
import TrainerService from "../service/Trainer-service.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";
import { getPagination } from "../utils/pagination.js";

const trainerService = new TrainerService();
const singleUploader = upload.single("image");
const resultSheetUploader = upload.single("resultSheet");

const createTrainer = asyncHandler(async (req, res) => {
  await runUpload(singleUploader, req, res);
  const trainer = await trainerService.createTrainer(
    { ...req.body, profilePic: req.file?.location },
    req.user.id
  );
  return res.status(StatusCodes.CREATED).json({
    data: trainer,
    success: true,
    message: "Trainer created",
  });
});

const getAllTrainers = asyncHandler(async (req, res) => {
  const response = await trainerService.getAllTrainer(getPagination(req.query));
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched successfully",
  });
});

const getTrainerById = asyncHandler(async (req, res) => {
  const response = await trainerService.getTrainerById(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched successfully",
  });
});

const deleteTrainer = asyncHandler(async (req, res) => {
  const response = await trainerService.deleteTrainer(req.params.id, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "trainer deleted successfully",
  });
});

const getAllTrainersOfaTrainingPartner = asyncHandler(async (req, res) => {
  const response = await trainerService.getAllTrainerBelongsToTrainingPartner(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fethed sucessfully",
  });
});

const uploadTrainerResultSheet = asyncHandler(async (req, res) => {
  await runUpload(resultSheetUploader, req, res);
  const response = await trainerService.uploadTResultSheet(
    req.params.id,
    req.file?.location,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "result sheet uploaded",
    data: response,
  });
});

export {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  deleteTrainer,
  getAllTrainersOfaTrainingPartner,
  uploadTrainerResultSheet,
};
