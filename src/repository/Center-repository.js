import CrudRepository from "./crud.repository.js";
import Center from "../models/Center.js";

class CenterRepository extends CrudRepository {
  constructor() {
    super(Center);
  }
}

export default CenterRepository;
