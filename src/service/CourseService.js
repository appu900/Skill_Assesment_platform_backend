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
      const sectorName = data.sectorName;
      const sector = await this.sectorRepository.getByName(sectorName);
      if (!sector) {
        throw new Error("Sector not found");
      }
      const course = await this.courseRepository.create(data);
      sector.courses.push(course);
      await sector.save();
      return course;
    } catch (error) {
      throw error;
    }
  }

  async getAllCourses() {
    try {
      const response = await this.courseRepository.getAll();
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default CourseService;
