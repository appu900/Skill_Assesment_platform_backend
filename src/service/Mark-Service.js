
import Exam from "../models/Exam.model.js";
import ExamRepository from "../repository/Exam-repository.js";
import MarkRepository from "../repository/Mark-repository.js";
import StudentRepository from "../repository/student-repository.js";

class MarkService {
  constructor() {
    this.markRepository = new MarkRepository();
    this.studentRepository = new StudentRepository();
    this.examRepository = new ExamRepository();
  }

  // batchid,
  // sector
  async create(data) {
    try {
      const student = await this.studentRepository.get(data.studentId);
      if (!student) {
        throw new Error("student details not found");
      }
      if (student.markUploadStatus == true) {
        throw new Error("Mark already uploaded for this student");
      }
      data.MPR_ID = student.MPR_Id
      const mark = await this.markRepository.create(data);
      student.marks = mark._id;
      student.markUploadStatus = true;
      student.Grade = mark.Grade;
      await student.save();
      return mark;
    } catch (error) {
      throw error;
    }
  }

  async getIndividualStudentMarks(studentId) {
    try {
      const response = await this.markRepository.getMarkByStudentId(studentId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getStudentMarksByBatchId(batchId) {
    try {
      const response = await this.markRepository.getStudentMarksByBatchId(
        batchId
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllAttendanceSheetDetails(examId) {
    try {
      const examDetails = await this.examRepository.get(examId);
      return examDetails;
    } catch (error) {
      throw error;
    }
  }
}

export default MarkService;
