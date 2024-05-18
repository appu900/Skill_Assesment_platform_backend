import Admin from "../models/Admin.model.js";
import CrudRepository from "./crud.repository.js";


class AdminRepository extends CrudRepository {
  constructor() {
    super(Admin);
  }

  async findByEmail(email) {
    try {
      const res = await Admin.findOne({ email });
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default AdminRepository;
