import Exam from "../models/Exam.model.js";
import CrudRepository from "./crud.repository.js";

class ExamRepository extends CrudRepository {
  constructor() {
    super(Exam);
  }

  async getAExam(examId) {
    try {
      const exam = await Exam.findById(examId)
        .populate({
          path: "batchId",
          populate: {
            path: "students",
          },
        })
        .populate({ path: "assesmentAgencyId", select: "logo" });
      return exam;
    } catch (error) {
      throw error;
    }
  }

  async findAllExamsByTestAgencyId(testAgencyId) {
    try {
      const exams = await Exam.find({
        assesmentAgencyId: testAgencyId,
      }).populate("batchId");
      return exams;
    } catch (error) {
      throw error;
    }
  }

  async getAllExam() {
    try {
      const exams = await Exam.find()
        .populate({
          path: "batchId",
          populate: {
            path: "students",
            model: "Student",
          },
        })
        .lean();
      return exams;
    } catch (error) {
      throw error;
    }
  }

  async addAssessorToExam(examId, assesorId) {
    try {
      const response = await Exam.findByIdAndUpdate(
        examId,
        {
          AssessorId: assesorId,
        },
        { new: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default ExamRepository;
