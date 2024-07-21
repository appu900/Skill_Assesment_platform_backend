import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import ExamRepository from "../repository/Exam-repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";

class ExamService {
  constructor() {
    this.examRepository = new ExamRepository();
    this.batchRepository = new BatchRepository();
    this.assesmentAgencyRepository = new AssesmentAgencyRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  async createExam(
    courseName,
    date,
    batchId,
    assesmentAgencyId,
    trainingPartnerId
  ) {
    try {
      const batch = await this.batchRepository.get(batchId);

      if (!batch) {
        throw new Error("batch not found");
      }

      if (batch.isAssigned) {
        throw new Error("batch is already assigned to an exam");
      }

      const trainingPartner = await this.trainingPartnerRepository.get(
        trainingPartnerId
      );

      if (!trainingPartner) {
        throw new Error("training partner not found");
      }

      const assesmentAgency = await this.assesmentAgencyRepository.get(
        assesmentAgencyId
      );

      if (!assesmentAgency) {
        throw new Error("assesment agency not found");
      }

      const payload = {
        course: courseName,
        date: date,
        sector: batch.sectorName,
        state: batch.state,
        scheme: batch.scheme,
        CenterName: batch.CenterName,
        CenterCode: batch.CenterCode,
        batchId: batch._id,
        assesmentAgencyId: assesmentAgency._id,
        assesmentAgency: assesmentAgency.agencyName,
        TrainingOrganization: trainingPartner.organizationName,
        TrainingPartnerId: trainingPartner._id,
        batchABN: batch.ABN_Number,
      };

      batch.isAssigned = true;
      await batch.save();

      const response = await this.examRepository.create(payload);
      return response;
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

  async assignAssesor(examId, assesorId) {
    try {
      const exam = await this.examRepository.addAssessorToExam(
        examId,
        assesorId
      );
      const batch = await this.batchRepository.get(exam.batchId);
      batch.assessorId = assesorId;
      await batch.save();
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getAExamDetails(examId) {
    try {
      const exam = await this.examRepository.getAExam(examId);
      return exam;
    } catch (error) {
      throw error;
    }
  }

  async getAttendanceSheet(examId) {
    try {
      const exam = await this.examRepository.getAExam(examId);
      return exam;
    } catch (error) {
      throw error;
    }
  }
}

export default ExamService;
