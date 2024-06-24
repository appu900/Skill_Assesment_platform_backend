import { StatusCodes } from "http-status-codes";
import MarkService from "../service/Mark-Service.js";

const markService = new MarkService();

const uploadMark = async (req, res) => {
  try {
    console.log(req.body);
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


const getMarksOfBatch = async (req, res) => {
  try {
    const response = await markService.getMarksOfBatch(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "marks fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong is fetching the marks",
    });
  }
};


const getMarksOfStudent = async (req, res) => {
  try {
    const response = await markService.getStudentMarks(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "marks fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong is fetching the marks",
    });
  }
}

export { uploadMark,getMarksOfBatch,getMarksOfStudent };
