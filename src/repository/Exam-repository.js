import Exam from "../models/Exam.model.js";
import getMonthName from "../utils/getMonthName.js";
import CrudRepository from "./crud.repository.js";
import AppError from "../utils/AppError.js";
import { applyPagination } from "../utils/pagination.js";

class ExamRepository extends CrudRepository {
  constructor() {
    super(Exam);
  }

  async getAExam(examId) {
    return Exam.findById(examId)
      .populate({
        path: "batchId",
        populate: {
          path: "students",
        },
      })
      .populate({ path: "assesmentAgencyId", select: "logo" });
  }

  async findAllExamsByTestAgencyId(testAgencyId) {
    return Exam.find({ assesmentAgencyId: testAgencyId }).sort({ _id: -1 }).populate("batchId");
  }

  async getAllExam(pagination = null) {
    return applyPagination(
      Exam.find()
        .sort({ _id: -1 })
        .populate({
          path: "batchId",
          populate: {
            path: "students",
            model: "Student",
          },
        }),
      pagination
    ).lean();
  }

  async addAssessorToExam(examId, assesorId) {
    return Exam.findByIdAndUpdate(examId, { AssessorId: assesorId }, { new: true });
  }

  // ** date comes as dd/mm/yyyy and is stored as dd-MonthName-yyyy
  async updateExamDate(examId, date) {
    const [day, month, year] = String(date).split("/");
    const monthName = getMonthName(month);
    if (!day || !monthName || !/^\d{4}$/.test(year || "")) {
      throw new AppError("Date must be in dd/mm/yyyy format");
    }
    return Exam.findByIdAndUpdate(
      examId,
      {
        assesmentdate: `${day}-${monthName}-${year}`,
        month: monthName,
        year: year,
      },
      { new: true }
    );
  }

  async updatePaymentStatus(examId) {
    return Exam.findByIdAndUpdate(examId, { paymentStatus: true }, { new: true });
  }

  async updateManyPaymentStatus(examIds) {
    return Exam.updateMany({ _id: { $in: examIds } }, { paymentStatus: true });
  }

  // ** completed exams of an assesment agency in a month
  async filterExamByMonthAndYear(assesmentAgencyId, month, year) {
    return Exam.find({
      assesmentAgencyId: assesmentAgencyId,
      month: month,
      year: year,
      markUploadAndExamCompleteStatus: true,
    });
  }

  async findExamByBatchId(batchId) {
    return Exam.findOne({ batchId })
      .populate("batchId")
      .populate("AssessorId")
      .populate({ path: "assesmentAgencyId", select: "logo" });
  }

  async updateStudentAttendance(examId, data) {
    return Exam.findByIdAndUpdate(examId, { presentStudents: data }, { new: true });
  }
}

export default ExamRepository;
