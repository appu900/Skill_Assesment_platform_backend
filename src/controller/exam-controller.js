import { StatusCodes } from "http-status-codes";
import ExamService from "../service/Exam-service.js";
import CertificateService from "../service/CertificateService.js";
import upload from "../config/s3-imageUpload-config.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";
import { getPagination } from "../utils/pagination.js";

const examService = new ExamService();
const certificateService = new CertificateService();

const fileUploader = upload.fields([
  { name: "attendanceSheet", maxCount: 1 },
  { name: "resultSheet", maxCount: 1 },
]);
const multiplePhotoUploader = upload.array("photos", 10);

const assignAnExam = asyncHandler(async (req, res) => {
  const exam = await examService.createExam(
    req.body.courseName,
    req.body.batchId,
    req.body.assesmentAgencyId
  );
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: exam,
    message: "exam scheduled sucessfully",
  });
});

const getALlExams = asyncHandler(async (req, res) => {
  const exams = await examService.getALlExamDetails(getPagination(req.query));
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "data fetched sucessfully",
    data: exams,
  });
});

const getALLExamsBelongsToAnAssesmentAgency = asyncHandler(async (req, res) => {
  const exams = await examService.getExamsByAgencyId(req.params.id);
  return res.status(StatusCodes.OK).json({
    data: exams,
    success: true,
    message: "data fetched sucessfully",
  });
});

const assignAssesorToExam = asyncHandler(async (req, res) => {
  const response = await examService.assignAssesor(req.params.id, req.body.assessorId, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "assesor assigned",
    data: response,
  });
});

const fetchAExamDetails = asyncHandler(async (req, res) => {
  const response = await examService.getAExamDetails(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const getAttendanceSheetForExam = asyncHandler(async (req, res) => {
  const response = await examService.getAttendanceSheet(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const changeExamCompleteStatus = asyncHandler(async (req, res) => {
  await runUpload(fileUploader, req, res);
  const response = await examService.updateExamStatus(
    req.params.id,
    req.files?.attendanceSheet?.[0]?.location,
    req.files?.resultSheet?.[0]?.location,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "exam status changed",
    data: response,
  });
});

const uploadPhotos = asyncHandler(async (req, res) => {
  await runUpload(multiplePhotoUploader, req, res);
  const imagePayload = (req.files || []).map((item) => item.location);
  const response = await examService.uploadMultiplePhotos(req.params.id, imagePayload, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "photos uploaded",
    data: response,
  });
});

const addAssesmentDate = asyncHandler(async (req, res) => {
  const response = await examService.updateAssesmentDate(req.params.id, req.body.date, req.user);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "date updated",
    data: response,
  });
});

const updateExamPaymentStatus = asyncHandler(async (req, res) => {
  const response = await examService.updatePaymentStatus(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "payment status updated",
    data: response,
  });
});

const updateStudentAttendanceNumber = asyncHandler(async (req, res) => {
  const response = await examService.updateCandidateAttendanceNumber(
    req.params.id,
    req.body.attendanceNumber,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "attendance number updated",
    data: response,
  });
});

// ** certificates are generated in the background (bullmq), poll the status endpoint for progress
const publishCertificate = asyncHandler(async (req, res) => {
  const response = await examService.publishCeritificates(req.params.id);
  return res.status(StatusCodes.ACCEPTED).json({
    success: true,
    data: response,
    message: "Certificate generation started",
  });
});

const getCertificatePublishStatus = asyncHandler(async (req, res) => {
  const response = await certificateService.getPublishStatus(req.params.id);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
  });
});

export {
  assignAnExam,
  getALlExams,
  getALLExamsBelongsToAnAssesmentAgency,
  assignAssesorToExam,
  fetchAExamDetails,
  getAttendanceSheetForExam,
  changeExamCompleteStatus,
  uploadPhotos,
  updateExamPaymentStatus,
  addAssesmentDate,
  updateStudentAttendanceNumber,
  publishCertificate,
  getCertificatePublishStatus,
};
