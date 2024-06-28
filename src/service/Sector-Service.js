import SectorRepository from "../repository/sector-repository.js";

class SectorService {
  constructor() {
    this.sectorRepository = new SectorRepository();
  }

  async create(data) {
    try {
      const response = await this.sectorRepository.create(data);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default SectorService;
