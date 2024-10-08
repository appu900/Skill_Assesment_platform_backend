import CrudRepository from "./crud.repository.js";
import Mark from "../models/Marks.model.js";

class MarkRepository extends CrudRepository {
  constructor() {
    super(Mark);
  }

  async getMarkByStudentId(studentId) {
    try {
      const response = await Mark.findOne({ studentId: studentId });
      console.log(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getStudentMarksByBatchId(batchId) {
    try {
      const response = await Mark.find({ batchId: batchId });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllMarksByExam(examId) {
    try {
      const response = await Mark.find({ examId: examId });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default MarkRepository;



