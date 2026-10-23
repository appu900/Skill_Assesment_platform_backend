import { StatusCodes } from "http-status-codes";
import upload from "../config/s3-imageUpload-config.js";
import SchemeService from "../service/SchemeService.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";

const schemeService = new SchemeService();
const singleFileUploader = upload.single("image");

const createScheme = asyncHandler(async (req, res) => {
  await runUpload(singleFileUploader, req, res);
  const response = await schemeService.create({ ...req.body, logo: req.file?.location });
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: response,
    message: "Scheme created successfully",
  });
});

const fetchAllSchems = asyncHandler(async (req, res) => {
  const response = await schemeService.getAllSchems();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "All Schemes fetched successfully",
  });
});

const fetchAllSchemeOfSchemeType = asyncHandler(async (req, res) => {
  const response = await schemeService.getSchemeBySchemeType(req.query.schemeType);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "All Schemes fetched successfully",
  });
});

export { createScheme, fetchAllSchems, fetchAllSchemeOfSchemeType };
