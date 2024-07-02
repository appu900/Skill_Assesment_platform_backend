import SchemeRepository from "../repository/SchemeRepository.js";

class SchemeService {
  constructor() {
    this.schemeRepo = new SchemeRepository();
  }

  async create(data) {
    try {
      const res = await this.schemeRepo.create(data);
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default SchemeService;
