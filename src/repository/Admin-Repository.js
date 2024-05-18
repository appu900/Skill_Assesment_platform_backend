import Admin from "../models/Admin.model.js";
import CrudRepository from "./crud.repository.js";


class AdminRepository extends CrudRepository {
  constructor() {
    super(Admin);
  }
}

export default AdminRepository;
