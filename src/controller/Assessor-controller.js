import { StatusCodes } from "http-status-codes";
import upload from "../config/s3-imageUpload-config.js";
import AssessorService from "../service/Assessor-service.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";

const assessorService = new AssessorService();
const singleUploder = upload.single("markSheet");

const createAssessor = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.file?.location) {
    payload.profilePic = req.file.location;
  }
  const response = await assessorService.create(payload, req.user);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "assessor created",
    data: response,
  });
});

const uploadAssesorMarkSheet = asyncHandler(async (req, res) => {
  await runUpload(singleUploder, req, res);
  const response = await assessorService.uploadAssessorMarkSheet(
    req.params.id,
    req.file?.location,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "marksheet uploaded",
    data: response,
  });
});

const getAllAssesor = asyncHandler(async (req, res) => {
  const response = await assessorService.getAllAssesorOfAssesmentAgency(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "all assessor fetched",
    data: response,
  });
});

export { createAssessor, uploadAssesorMarkSheet, getAllAssesor };
