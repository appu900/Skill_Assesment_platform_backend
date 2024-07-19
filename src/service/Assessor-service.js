import AssessorRepository from "../repository/Assessor-Repository.js";

class AssessorService {
  constructor() {
    this.assessorRepository = new AssessorRepository();
  }

  async create(data) {
    try {
      const response = await this.assessorRepository.create(data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async uploadAssessorMarkSheet(id, marksheetUrlLink) {
    try {
      const assessor = await this.assessorRepository.get(id);
      if (!assessor) {
        throw new Error("Assessor Not found");
      }
      assessor.resultSheet = marksheetUrlLink;
      await assessor.save();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

export default AssessorService;
