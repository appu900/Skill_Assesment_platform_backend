import Mark from "../models/Marks.model.js";
import CrudRepository from "./crud.repository.js";

class MarkRepository extends CrudRepository {
  constructor() {
    super(Mark);
  }
}

export default MarkRepository;
