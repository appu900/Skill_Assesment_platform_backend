import CourseRepository from "../repository/course-repository.js";
import SectorRepository from "../repository/sector-repository.js";

class SectorService {
  constructor() {
    this.sectorRepository = new SectorRepository();
    this.courseRepository = new CourseRepository();
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
      const response = await this.courseRepository.getAllCoursesBySectorName(sectorName);
      return response
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
