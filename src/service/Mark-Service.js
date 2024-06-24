import MarkRepository from "../repository/Mark-repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import StudentRepository from "../repository/student-repository.js";

class MarkService {
  constructor() {
    this.markRepository = new MarkRepository();
    this.batchRepository = new BatchRepository();
    this.studentRepository = new StudentRepository();
  }

  /***
   *  studentId
   *  batchId,
   *  marks
   *  grade
   */

  async addMark(data) {
    try {
      const batch = await this.batchRepository.get(data.batchId);
      if (!batch) {
        throw new Error("invalid Batch Details");
      }

      const student = await this.studentRepository.get(data.studentId);
      if (!student) {
        throw new Error("wrong student information");
      }

      const payload = {
        student: student._id,
        batchId: batch._id,
        mark: data.marks,
        grade: data.grade,
      };

      const res = await this.markRepository.create(payload);
      return res;
    } catch (error) {
      console.log(error.message)
      throw error;
    }
  }

  // ** get all marks of a perticual batch

  async getMarksOfBatch(batchId) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("invalid Batch Details");
      }

      const res = await this.markRepository.getBatchMarks(batchId);
      const responsePayload = {
        batch: res,
      };
      return res;
    } catch (error) {
      throw error;
    }
  }

  // ** get marks details of a perticular student

  async getStudentMarks(studentId) {
    try {
      const student = await this.studentRepository.get(studentId);
      if (!student) {
        throw new Error("invalid student Details");
      }
      const res = await this.markRepository.getStudentMarks(studentId);
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default MarkService;

