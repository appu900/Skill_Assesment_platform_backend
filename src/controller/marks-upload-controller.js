import { StatusCodes } from "http-status-codes";
import MarkService from "../service/Mark-Service.js";
import asyncHandler from "../utils/asyncHandler.js";

const markService = new MarkService();

const createMark = asyncHandler(async (req, res) => {
  const response = await markService.create(req.body, req.user);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: response,
    message: "mark uploaded sucessfully",
  });
});

const getIndividualStudentMarks = asyncHandler(async (req, res) => {
  const response = await markService.getIndividualStudentMarks(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const getStudentMarksByBatchId = asyncHandler(async (req, res) => {
  const response = await markService.getStudentMarksByBatchId(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const getBatchMarkData = asyncHandler(async (req, res) => {
  const response = await markService.getGroupMarksData(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

export { createMark, getIndividualStudentMarks, getStudentMarksByBatchId, getBatchMarkData };
