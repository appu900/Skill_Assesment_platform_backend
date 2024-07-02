import CrudRepository from "./crud.repository.js";
import Scheme from "../models/Scheme.js";

class SchemeRepository extends CrudRepository {
  constructor() {
    super(Scheme);
  }
}

export default SchemeRepository;
