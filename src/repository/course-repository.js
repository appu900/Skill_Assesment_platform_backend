import Course from "../models/course.js";
import CrudRepository from "./crud.repository.js";

class CourseRepository extends CrudRepository {
  constructor() {
    super(Course);
  }

  async getAllCoursesBySectorName(sectorName) {
    return Course.find({ sectorName: String(sectorName) });
  }
}

export default CourseRepository;
