import TrainerService from "../service/Trainer-service.js";
import { StatusCodes } from "http-status-codes";
const trainerService = new TrainerService();

const createTrainer = async (req, res) => {
  try {
    const response = req.trainingPartnerId;
    console.log(req.trainingPartnerId)
    return res.status(StatusCodes.CREATED).json({
      data: response,
      success: true,
      message: "Training Parter created",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Something went wrong",
    });
  }
};

export { createTrainer };
