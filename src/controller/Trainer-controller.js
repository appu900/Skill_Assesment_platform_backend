import upload from "../config/s3-imageUpload-config.js";
import TrainerService from "../service/Trainer-service.js";
import { StatusCodes } from "http-status-codes";
const trainerService = new TrainerService();

const singleUploader = upload.single("image");
const singleUploaderTwo = upload.single("resultSheet");

// const createTrainer = async (req, res) => {
//   singleUploader(req, res, async function (err, data) {
//     if (err) {
//       return res
//         .status(StatusCodes.INTERNAL_SERVER_ERROR)
//         .json({ "message:": "something went wrong" });
//     }
  
//   try {
//     const imageUrl = req.file?.location;
//     const payload = req.body;
//     payload.trainingPartner = req.trainingPartnerId;
//     payload.profilePic = imageUrl;
//     const trainer = await trainerService.createTrainer(payload);
//     return res.status(StatusCodes.CREATED).json({
//       data: trainer,
//       success: true,
//       message: "Training Parter created",
//     });
//   }
//   catch (error) {
//     if (error.message === "Trainer already exists") {
//       return res.status(StatusCodes.CONFLICT).json({
//         success: false,
//         message: error.message,
//       });
//     }
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       error: error.message,
//       message: "Something went wrong",
//     });
//   }
// };
const createTrainer = async (req, res) => {
  singleUploader(req, res, async function (err) {
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Something went wrong" });
    }

    try {
      const imageUrl = req.file?.location;
      const payload = req.body;
      payload.trainingPartner = req.trainingPartnerId;
      payload.profilePic = imageUrl;

      const trainer = await trainerService.createTrainer(payload);

      return res.status(StatusCodes.CREATED).json({
        data: trainer,
        success: true,
        message: "Training Partner created",
      });
    } catch (error) {
      if (error.message === "Trainer already exists") {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        message: "Something went wrong",
      });
    }
  });
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

const uploadTrainerResultSheet = async (req, res) => {
  try {
    singleUploaderTwo(req, res, async function (err) {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: err.message,
          message: "something went wrong",
        });
      }
      const imageUrl = req.file?.location;
      const id = req.params.id;
      const response = await trainerService.uploadTResultSheet(id, imageUrl);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "result sheet uploaded",
        data: response,
      });
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "cannot upload result sheet",
    });
  }
};

export {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  deleteTrainer,
  getAllTrainersOfaTrainingPartner,
  uploadTrainerResultSheet,
};
