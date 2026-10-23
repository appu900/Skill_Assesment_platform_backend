import CrudRepository from "./crud.repository.js";
import Assessor from "../models/Assessor.js";

class AssessorRepository extends CrudRepository {
  constructor() {
    super(Assessor);
  }

  async getAllAssesorByAssesmentAgencyId(assesmentAgencyId) {
    return Assessor.find({ AssesmentAgency: assesmentAgencyId });
  }
}

export default AssessorRepository;
