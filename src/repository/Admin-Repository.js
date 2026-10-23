import Admin from "../models/Admin.model.js";
import CrudRepository from "./crud.repository.js";

class AdminRepository extends CrudRepository {
  constructor() {
    super(Admin);
  }

  async findByEmail(email) {
    return Admin.findOne({ email: String(email) });
  }

  async count() {
    return Admin.countDocuments();
  }
}

export default AdminRepository;
