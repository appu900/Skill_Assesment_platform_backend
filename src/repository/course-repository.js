import Course from "../models/course.js";
import CrudRepository from "./crud.repository.js";

class CourseRepository extends CrudRepository {
  constructor() {
    super(Course);
  }
}

export default CourseRepository;
