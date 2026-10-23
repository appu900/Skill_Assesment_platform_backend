import { StatusCodes } from "http-status-codes";
import StudentService from "../service/student-service.js";
import upload from "../config/s3-imageUpload-config.js";
import CertificateService from "../service/CertificateService.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";
import AppError from "../utils/AppError.js";

const studentService = new StudentService();
const certificateService = new CertificateService();
const singleUploader = upload.single("image");

const createStudent = asyncHandler(async (req, res) => {
  const response = await studentService.createStudent(req.body, req.user.id);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: response,
    message: "student added sucessfully",
  });
});

const getStudentDetails = asyncHandler(async (req, res) => {
  const response = await studentService.getStudentByid(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const updateProfilePic = asyncHandler(async (req, res) => {
  await runUpload(singleUploader, req, res);
  const imageUrl = req.file?.location;
  if (!imageUrl) {
    throw new AppError("image not uploaded");
  }
  await studentService.uploadProfilePic(req.params.id, imageUrl, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "profile pic uploaded sucessfully",
  });
});

const markStudentAbsent = asyncHandler(async (req, res) => {
  const response = await studentService.updateStudentAsAbsent(req.params.id, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "student marked as absent",
  });
});

// ** public certificate verification by enrollment number
const getStudentCertificateByStudentenrollementId = asyncHandler(async (req, res) => {
  const { enrollmentNumber } = req.body;
  if (!enrollmentNumber) {
    throw new AppError("enrollment number is required");
  }
  const response = await certificateService.getStudentCertificateByStudentEnrollementId(
    enrollmentNumber
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

export {
  createStudent,
  getStudentDetails,
  updateProfilePic,
  markStudentAbsent,
  getStudentCertificateByStudentenrollementId,
};
