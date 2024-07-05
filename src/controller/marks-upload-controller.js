import MarkService from "../service/Mark-Service.js";
import { StatusCodes } from "http-status-codes";

const markService = new MarkService();

const createMark = async (req, res) => {
  try {
    const payload = req.body;
    payload.AssesmentAgencyName = req.assesmentAgencyName;
    const response = await markService.create(payload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "mark uploaded sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getIndividualStudentMarks = async (req, res) => {
  try {
    const studentId = req.params.id;
    const response = await markService.getIndividualStudentMarks(studentId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getStudentMarksByBatchId = async (req, res) => {
  try {
    const batchId = req.params.id;
    const response = await markService.getStudentMarksByBatchId(batchId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};
export { createMark, getIndividualStudentMarks, getStudentMarksByBatchId };
