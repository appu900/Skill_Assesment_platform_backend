import MarkRepository from "../repository/Mark-repository.js";
import StudentRepository from "../repository/student-repository.js";

class MarkService {
  constructor() {
    this.markRepository = new MarkRepository();
    this.studentRepository = new StudentRepository();
  }

  // batchid,
  // sector
  async create(data) {
    try {
      const student = await this.studentRepository.get(data.studentId);
      if (!student) {
        throw new Error("student details not found");
      }
      const mark = await this.markRepository.create(data);
      student.marks = mark._id;
      await student.save();
      return mark;
    } catch (error) {
      throw error;
    }
  }
}

export default MarkService;
