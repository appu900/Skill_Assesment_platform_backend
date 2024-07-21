import CrudRepository from "./crud.repository.js";
import Assessor from "../models/Assessor.js";

class AssessorRepository extends CrudRepository {
  constructor() {
    super(Assessor);
  }

  async getAllAssesorByAssesmentAgencyId(assesmentAgencyId) {
    try {
      const response = await Assessor.find({
        AssesmentAgency: assesmentAgencyId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default AssessorRepository;
