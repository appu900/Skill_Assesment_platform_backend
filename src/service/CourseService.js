import CourseRepository from "../repository/course-repository.js";
import SectorRepository from "../repository/sector-repository.js";

class CourseService {
  constructor() {
    this.courseRepository = new CourseRepository();
    this.sectorRepository = new SectorRepository();
  }

//   ** sectorId from reques.body
  async create(data) {
    try {
      const course = await this.courseRepository.create(data);
      return course;
    } catch (error) {
      throw error;
    }
  }
}

export default CourseService;
