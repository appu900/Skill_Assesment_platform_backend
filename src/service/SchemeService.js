import SchemeRepository from "../repository/SchemeRepository.js";

class SchemeService {
  constructor() {
    this.schemeRepo = new SchemeRepository();
  }

  async create(data) {
    return this.schemeRepo.create(data);
  }

  async getAllSchems() {
    return this.schemeRepo.getAll();
  }

  async getSchemeBySchemeType(schemeType) {
    return this.schemeRepo.findBySchemeType(schemeType);
  }
}

export default SchemeService;
