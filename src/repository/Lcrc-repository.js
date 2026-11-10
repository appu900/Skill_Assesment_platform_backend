import CrudRepository from "./crud.repository.js";
import Lcrc from "../models/Lcrc.model.js";

class LcrcRepository extends CrudRepository {
  constructor() {
    super(Lcrc);
  }

  async findByEmail(email) {
    return Lcrc.findOne({ email: String(email).toLowerCase().trim() });
  }
}

export default LcrcRepository;
