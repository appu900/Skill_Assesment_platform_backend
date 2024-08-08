import { StatusCodes } from "http-status-codes";
import ExamService from "../service/Exam-service.js";
import upload from "../config/s3-imageUpload-config.js";
const examService = new ExamService();

const fileUploader = upload.fields([
  { name: "attendanceSheet", maxCount: 1 },
  { name: "resultSheet", maxCount: 1 },
]);

const multiplePhotoUploader = upload.array("photos", 10);

const assignAnExam = async (req, res) => {
  try {
    const exam = await examService.createExam(
      req.body.courseName,
      req.body.batchId,
      req.body.assesmentAgencyId,
      req.body.trainingPartnerId,
    );
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: exam,
      message: "exam scheduled sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getALlExams = async (req, res) => {
  try {
    const exams = await examService.getALlExamDetails();
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "data fetched sucessfully",
      data: exams,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getALLExamsBelongsToAnAssesmentAgency = async (req, res) => {
  try {
    const id = req.params.id;
    const exams = await examService.getExamsByAgencyId(id);
    return res.status(StatusCodes.OK).json({
      data: exams,
      success: true,
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

const assignAssesorToExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const assessorId = req.body.assessorId;
    const response = await examService.assignAssesor(examId, assessorId);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "assesor assigned",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const fetchAExamDetails = async (req, res) => {
  try {
    const response = await examService.getAExamDetails(req.params.id);
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

const getAttendanceSheetForExam = async (req, res) => {
  try {
    const response = await examService.getAttendanceSheet(req.params.id);
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

async function changeExamCompleteStatus(req, res) {
  try {
    fileUploader(req, res, async function (err) {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: err.message,
          message: "something went wrong in uploading files",
        });
      }

      const examId = req.params.id;
      const attendanceSheet = req.files?.attendanceSheet[0].location;
      const resultSheet = req.files?.resultSheet[0].location;

      const response = await examService.updateExamStatus(
        examId,
        attendanceSheet,
        resultSheet
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "exam status changed",
        data: response,
      });
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
}

const uploadPhotos = async (req, res) => {
  try {
    multiplePhotoUploader(req, res, async function (err) {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: err.message,
          message: "something went wrong in uploading files",
        });
      }
      console.log(req.files);
      const id = req.params.id;
      const imagePayload = req.files?.map((item) => item.location);
      const response = await examService.uploadMultiplePhotos(id, imagePayload);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "photos uploaded",
        data: response,
      });
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const addAssesmentDate = async (req, res) => {
  try {
    const id = req.params.id;
    const date = req.body.date;
    const response = await examService.updateAssesmentDate(id, date);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "date updated",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const updateExamPaymentStatus = async (req, res) => {
  try {
    const examId = req.params.id;
    console.log(examId);
    const response = await examService.updatePaymentStatus(examId);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "payment status updated",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const updateStudentAttendanceNumber = async (req, res) => {
  try {
    const response = await examService.updateCandidateAttendanceNumber(
      req.params.id,
      req.body.attendanceNumber
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "attendance number updated",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const publishCertificate = async (req, res) => {
  try {
    const examId = req.params.id;
    const response = await examService.publishCeritificates(examId);
    return res.status(StatusCodes.OK).json({
      message: "Certificate Issued sucessfully",
    });
  } catch (error) {
    return (
      res.status(StatusCodes.INTERNAL_SERVER_ERROR),
      json({
        success: false,
        error: error.message,
        message: "please try again after some time",
      })
    );
  }
};

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
  publishCertificate
};
