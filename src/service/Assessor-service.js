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
}

export default AssessorService;
