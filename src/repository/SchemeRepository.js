import CrudRepository from "./crud.repository.js";
import Scheme from "../models/Scheme.js";

class SchemeRepository extends CrudRepository {
  constructor() {
    super(Scheme);
  }

  async findBySchemeType(schemeType){
    try {
      const response = await Scheme.find({schemeType: schemeType});
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default SchemeRepository;
