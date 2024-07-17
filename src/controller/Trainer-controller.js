import upload from "../config/s3-imageUpload-config.js";
import TrainerService from "../service/Trainer-service.js";
import { StatusCodes } from "http-status-codes";
const trainerService = new TrainerService();

const singleUploader = upload.single("image");

const createTrainer = async (req, res) => {
  try {
    singleUploader(req, res, async function (err, data) {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ "message:": "something went wrong" });
      }
      const imageUrl = req.file?.location;
      const payload = req.body;
      payload.trainingPartner = req.trainingPartnerId;
      payload.profilePic = imageUrl;
      const trainer = await trainerService.createTrainer(payload);
      return res.status(StatusCodes.CREATED).json({
        data: trainer,
        success: true,
        message: "Training Parter created",
      });
    });
   
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Something went wrong",
    });
  }
};

const getAllTrainers = async (req, res) => {
  try {
    const response = await trainerService.getAllTrainer();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Something went wrong",
    });
  }
};

const getTrainerById = async (req, res) => {
  try {
    const response = await trainerService.getTrainerById(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Something went wrong",
    });
  }
};

const deleteTrainer = async (req, res) => {
  try {
    const response = await trainerService.deleteTrainer(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Something went wrong",
    });
  }
};

const getAllTrainersOfaTrainingPartner = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await trainerService.getAllTrainerBelongsToTrainingPartner(
      id
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fethed sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "data fetched sucessfully",
    });
  }
};

export {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  deleteTrainer,
  getAllTrainersOfaTrainingPartner,
};
