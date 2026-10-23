import CrudRepository from "./crud.repository.js";
import Mark from "../models/Marks.model.js";

class MarkRepository extends CrudRepository {
  constructor() {
    super(Mark);
  }

  async getMarkByStudentId(studentId) {
    return Mark.findOne({ studentId: studentId });
  }

  async getMarkByExamAndStudent(examId, studentId) {
    return Mark.findOne({ examId, studentId });
  }

  async getStudentMarksByBatchId(batchId) {
    return Mark.find({ batchId: batchId });
  }

  async getAllMarksByExam(examId) {
    return Mark.find({ examId: examId });
  }

  async countByExam(examId) {
    return Mark.countDocuments({ examId });
  }
}

export default MarkRepository;
