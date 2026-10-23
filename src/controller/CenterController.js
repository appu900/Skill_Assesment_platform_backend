import { StatusCodes } from "http-status-codes";
import CenterService from "../service/centerService.js";
import upload from "../config/s3-imageUpload-config.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";
import AppError from "../utils/AppError.js";

const singleUploder = upload.single("letter");
const centerService = new CenterService();

const createCenter = asyncHandler(async (req, res) => {
  await runUpload(singleUploder, req, res);
  const payload = { ...req.body, sanction_order_letter: req.file?.location };
  const response = await centerService.create(payload, req.user.id);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Center created",
    data: response,
  });
});

const getAllCentersOfTrainingPartner = asyncHandler(async (req, res) => {
  const response = await centerService.get(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Centers fetched",
    data: response,
  });
});

const filterCenterBySchemeAndState = asyncHandler(async (req, res) => {
  const response = await centerService.filterCentersData(req.query, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Centers fetched",
    data: response,
  });
});

const approveCenter = asyncHandler(async (req, res) => {
  const { schemeName, state } = req.body;
  const response = await centerService.approveCenter(req.params.id, schemeName, state, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Center approved",
    data: response,
  });
});

const getAllApprovedCentersByScheme = asyncHandler(async (req, res) => {
  const { trainingPartnerId, schemeName, state } = req.query;
  if (!trainingPartnerId || !schemeName || !state) {
    throw new AppError("trainingPartnerId, schemeName and state are required");
  }
  const response = await centerService.getAllCentersByApproveSchems(
    trainingPartnerId,
    schemeName,
    state
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "data fetched sucessfully",
    data: response,
  });
});

const updateCenterData = asyncHandler(async (req, res) => {
  const response = await centerService.updateCenterData(req.params.id, req.body, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Center updated",
    data: response,
  });
});

const getAllCenterBySchemeNameAndState = asyncHandler(async (req, res) => {
  const { state, scheme } = req.query;
  if (!state || !scheme) {
    throw new AppError("please provide state and scheme");
  }
  const response = await centerService.getAllCentersBySchemeName(scheme, state);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
  });
});

const getCenterDetails = asyncHandler(async (req, res) => {
  const response = await centerService.getACenterDetails(req.params.centerId);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Center details fetched",
    data: response,
  });
});

export {
  createCenter,
  getAllCentersOfTrainingPartner,
  filterCenterBySchemeAndState,
  approveCenter,
  getAllApprovedCentersByScheme,
  updateCenterData,
  getAllCenterBySchemeNameAndState,
  getCenterDetails,
};
