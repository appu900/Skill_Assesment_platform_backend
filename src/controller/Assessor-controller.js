import upload from "../config/s3-imageUpload-config.js";
import AssessorService from "../service/Assessor-service.js";
import { StatusCodes } from "http-status-codes";

const assessorService = new AssessorService();

const singleUploder = upload.single("markSheet");

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

const uploadAssesorMarkSheet = async (req, res) => {
  try {
    singleUploder(req, res, async function (err) {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: err.message,
          message: "something went wrong",
        });
      }
      const imageUrl = req.file?.location;
      const id = req.params.id;
      const response = await assessorService.uploadAssessorMarkSheet(
        id,
        imageUrl
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "marksheet uploaded",
        data: response,
      });
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "cannot upload marksheet",
    });
  }
};

export { createAssessor,uploadAssesorMarkSheet };
