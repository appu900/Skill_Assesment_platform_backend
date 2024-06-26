import Exam from "../models/Exam.model.js";
import CrudRepository from "./crud.repository.js";

class ExamRepository extends CrudRepository {
  constructor() {
    super(Exam);
  }

  async findAllExamsByTestAgencyId(testAgencyId) {
    try {
      const exams = await Exam.findOne({
        testAgency: testAgencyId,
      });
      return exams;
    } catch (error) {
      throw error;
    }
  }

  async getAllExam() {
    try {
      const exams = await Exam.find()
        .populate({
          path: "batch",
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
}

export default ExamRepository;
