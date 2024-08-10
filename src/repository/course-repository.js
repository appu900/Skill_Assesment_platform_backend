import Course from "../models/course.js";
import CrudRepository from "./crud.repository.js";

class CourseRepository extends CrudRepository {
  constructor() {
    super(Course);
  }

  async getAllCoursesBySectorName(sectorName){
    try {
      const response = await Course.find({sectorName: sectorName});
      return response;
    } catch (error) {
       throw error;
    }
  }
}

export default CourseRepository;
