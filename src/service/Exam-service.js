import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import ExamRepository from "../repository/Exam-repository.js";

class ExamService {
  constructor() {
    this.examRepository = new ExamRepository();
    this.batchRepository = new BatchRepository();
    this.assesmentAgencyRepository = new AssesmentAgencyRepository();
  }

  async createExam(name, date, batchId, assesmentAgencyId) {
    try {
      if (!name || !date || !batchId || !assesmentAgencyId) {
        throw new Error("invalid input");
      }
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("enter corect details to schedule a exam");
      }
      const assesmentAgency = await this.assesmentAgencyRepository.get(
        assesmentAgencyId
      );
      if (!assesmentAgency) {
        throw new Error("assesment agency information is wrong");
      }

      const exam = await this.examRepository.create({
        name: name,
        date: date,
        batch: batch._id,
        testAgency: assesmentAgency._id,
      });
      return exam;
    } catch (error) {
      throw error;
    }
  }

  async getALlExamDetails() {
    try {
      const exams = await this.examRepository.getAllExam();
      return exams;
    } catch (error) {
      throw error;
    }
  }

  async getExamsByAgencyId(testAgencyId) {
    try {
      const exams = await this.examRepository.findAllExamsByTestAgencyId(
        testAgencyId
      );
      return exams;
    } catch (error) {
      throw error;
    }
  }
}

export default ExamService;
