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
        studentId: student._id,
        batchId: batch._id,
        mark: data.marks,
        grade: data.grade,
      };

      const res = await this.markRepository.create(payload);
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default MarkService;
