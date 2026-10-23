import CrudRepository from "./crud.repository.js";
import Scheme from "../models/Scheme.js";

class SchemeRepository extends CrudRepository {
  constructor() {
    super(Scheme);
  }

  async findBySchemeType(schemeType) {
    return Scheme.find({ schemeType: String(schemeType) });
  }

  async findBySchemeName(schemeName) {
    return Scheme.findOne({ name: String(schemeName) });
  }
}

export default SchemeRepository;
