import { StatusCodes } from "http-status-codes";
import ExamService from "../service/Exam-service.js";
const examService = new ExamService();

const assignAnExam = async (req, res) => {
  try {
    const exam = await examService.createExam(
      req.body.courseName,
      req.body.date,
      req.body.batchId,
      req.body.assesmentAgencyId,
      req.body.trainingPartnerId
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

const fetchAExamDetails = async(req,res) =>{
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
}

export { assignAnExam, getALlExams, getALLExamsBelongsToAnAssesmentAgency,assignAssesorToExam ,fetchAExamDetails};
