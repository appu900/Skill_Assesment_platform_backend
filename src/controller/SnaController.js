import { StatusCodes } from "http-status-codes";
import SnaService from "../service/SnaService.js";
import BatchService from "../service/Batch-service.js";
import asyncHandler from "../utils/asyncHandler.js";

const snaService = new SnaService();
const batchService = new BatchService();

const createSNA = asyncHandler(async (req, res) => {
  const response = await snaService.create(req.body);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "SNA created successfully",
    data: response,
  });
});

const snaLogin = asyncHandler(async (req, res) => {
  const { email, password, scheme } = req.body;
  const response = await snaService.login(email, password, scheme);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "login success",
    data: response,
  });
});

const approveGovernmentSchemeBatches = asyncHandler(async (req, res) => {
  const response = await batchService.approveGovernmentBatch(req.params.id, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Batch approved successfully",
    data: response,
  });
});

const rejectGovernmentSchemeBatches = asyncHandler(async (req, res) => {
  const response = await batchService.rejectGovernmentBatch(req.params.id, req.body?.reason, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Batch sent back to the training partner",
    data: response,
  });
});

const getAllSnaDetails = asyncHandler(async (req, res) => {
  const response = await snaService.getAllSna();
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "fetched All Snas",
    data: response,
  });
});

export { createSNA, snaLogin, approveGovernmentSchemeBatches, rejectGovernmentSchemeBatches, getAllSnaDetails };
