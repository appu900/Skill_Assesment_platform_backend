import CourseRepository from "../repository/course-repository.js";
import SectorRepository from "../repository/sector-repository.js";

class SectorService {
  constructor() {
    this.sectorRepository = new SectorRepository();
    this.courseRepository = new CourseRepository();
  }

  async create(data) {
    return this.sectorRepository.create(data);
  }

  async getAllSector() {
    return this.sectorRepository.getAll();
  }

  async getCoursesOfSector(sectorName) {
    return this.courseRepository.getAllCoursesBySectorName(sectorName);
  }
}

export default SectorService;
