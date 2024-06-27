import CrudRepository from "./crud.repository.js";
import Assessor from "../models/Assessor.js";

class AssessorRepository extends CrudRepository {
  constructor() {
    super(Assessor);
  }
}

export default AssessorRepository;
