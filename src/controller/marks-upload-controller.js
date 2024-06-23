import { StatusCodes } from "http-status-codes";
import MarkService from "../service/Mark-Service.js";

const markService = new MarkService();

const uploadMark = async (req, res) => {
  try {
    const response = await markService.addMark(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "mark uploded sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong is uploading the marks",
    });
  }
};

export { uploadMark };
