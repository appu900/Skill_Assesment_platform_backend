import CourseRepository from "../repository/course-repository.js";
import SectorRepository from "../repository/sector-repository.js";
import AppError from "../utils/AppError.js";

class CourseService {
  constructor() {
    this.courseRepository = new CourseRepository();
    this.sectorRepository = new SectorRepository();
  }

  // ** a course always belongs to an existing sector (by sectorName)
  async create(data) {
    const sector = await this.sectorRepository.getByName(data.sectorName);
    if (!sector) {
      throw AppError.notFound("Sector not found");
    }
    const course = await this.courseRepository.create(data);
    sector.courses.push(course._id);
    await sector.save();
    return course;
  }

  async getAllCourses() {
    return this.courseRepository.getAll();
  }
}

export default CourseService;
