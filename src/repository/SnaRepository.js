import CrudRepository from "./crud.repository.js";
import SNA from "../models/SNA.js";

class SnaRepository extends CrudRepository {
  constructor() {
    super(SNA);
  }

  async findByEmail(email) {
    try {
      const response = await SNA.findOne({ email });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default SnaRepository;
