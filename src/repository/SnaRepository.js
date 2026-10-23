import CrudRepository from "./crud.repository.js";
import SNA from "../models/SNA.js";

class SnaRepository extends CrudRepository {
  constructor() {
    super(SNA);
  }

  async findByEmail(email) {
    return SNA.findOne({ email: String(email) });
  }
}

export default SnaRepository;
