import CrudRepository from "./crud.repository.js";
import Student from "../models/Student.model.js";

class StudentRepository extends CrudRepository {
  constructor() {
    super(Student);
  }
}

export default StudentRepository;

