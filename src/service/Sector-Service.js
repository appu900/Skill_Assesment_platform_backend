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

  async getAllSector() {
    try {
      const response = await this.sectorRepository.getAll();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getCoursesOfSector(sectorName) {
    try {
      const response = await this.sectorRepository.getCourseBySector(
        sectorName
      );
      return response.courses;
    } catch (error) {
      throw error;
    }
  }

  async getAllSectorsByASchemeNameAndState(scheme, state) {
    try {
      const response =
        await this.sectorRepository.getAllSectorsByScehemeAndStateName(
          scheme,
          state
        );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default SectorService;
