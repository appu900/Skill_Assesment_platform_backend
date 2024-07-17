import AssessorService from "../service/Assessor-service.js";
import { StatusCodes } from "http-status-codes";

const assessorService = new AssessorService();

const createAssessor = async (req, res) => {
  try {
    let payload = req.body;
    const imageUrl = req.file?.location;
    if (imageUrl) {
      payload.profilePic = imageUrl;
    }
    const response = await assessorService.create(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "assessor created",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      sucess: false,
      error: error.message,
      message: "can create assessor",
    });
  }
};

export { createAssessor };
