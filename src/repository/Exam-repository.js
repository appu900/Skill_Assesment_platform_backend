import Exam from "../models/Exam.model.js";
import getMonthName from "../utils/getMonthName.js";
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

  async updateExamDate(examId, date) {
    try {
      const [day, month, year] = date.split("/");
      const monthName = getMonthName(month);
      console.log("output",day, monthName, year);
      const response = await Exam.findByIdAndUpdate(
        examId,
        {
          assesmentdate: day,
          month: monthName,
          year: year,
        },
        { new: true }
      );
      return response;
      
    } catch (error) {
      console.log("repository layer error",error)
      throw error;
    }
  }

  async updatePaymentStatus(examId) {
    try {
      const response = await Exam.findByIdAndUpdate(
        examId,
        {
          paymentStatus: true,
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
