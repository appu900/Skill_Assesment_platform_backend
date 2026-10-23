import { StatusCodes } from "http-status-codes";
import AssesmentAgencyService from "../service/Assesment-Agency.js";
import upload from "../config/s3-imageUpload-config.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";
import AppError from "../utils/AppError.js";
import { getPagination } from "../utils/pagination.js";

const assesmentAgencyService = new AssesmentAgencyService();
const fileUploader = upload.fields([
  { name: "LETTER_OF_NCVET", maxCount: 1 },
  { name: "logo", maxCount: 1 },
]);

const createAssesmentAgency = asyncHandler(async (req, res) => {
  await runUpload(fileUploader, req, res);
  const letter = req.files?.LETTER_OF_NCVET?.[0]?.location;
  const logo = req.files?.logo?.[0]?.location;
  if (!letter || !logo) {
    throw new AppError("LETTER_OF_NCVET and logo files are required");
  }
  const assesmentAgency = await assesmentAgencyService.createAgency({
    ...req.body,
    LETTER_OF_NCVET: letter,
    logo,
  });
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: assesmentAgency,
    message: "Assesment Agency created sucessfully",
  });
});

const assesmentAgencylogin = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.login(req.body.email, req.body.password);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "login sucessfull",
  });
});

const updateAssesmentAgencyStatusToApproved = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.updateStatusToApproved(
    req.params.id,
    req.body.percentage
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "Application approved sucessfully",
  });
});

const updateAssesmentAgencyStatusToRejected = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.updateStatusToRejected(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "Application rejected sucessfully",
  });
});

const getAssesmentAgencyById = asyncHandler(async (req, res) => {
  const assesmentAgency = await assesmentAgencyService.getAssesmentAgencyById(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: assesmentAgency,
    message: "data fetched sucessfully",
  });
});

const getAllAssesmentAgency = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.getAllAssesmentAgency(getPagination(req.query));
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const getAllPendingAssesmentAgency = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.getAllPendingAssesmentAgencyApplocations();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const getAllApprovedAssesmentAgency = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.getAllApprovedAssesmentAgency();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const filterAssesmentgency = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.fiterData(req.query);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const updateBankDetails = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyService.addbankDetails(
    req.params.id,
    req.body.accountNumber,
    req.body.IFSC_Code,
    req.body.bankName,
    req.body.branchName,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "Bank details added sucessfully",
  });
});

export {
  createAssesmentAgency,
  assesmentAgencylogin,
  updateAssesmentAgencyStatusToApproved,
  updateAssesmentAgencyStatusToRejected,
  getAssesmentAgencyById,
  getAllAssesmentAgency,
  getAllPendingAssesmentAgency,
  getAllApprovedAssesmentAgency,
  filterAssesmentgency,
  updateBankDetails,
};
