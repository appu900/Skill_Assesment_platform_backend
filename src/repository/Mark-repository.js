import CrudRepository from "./crud.repository.js";
import Mark from "../models/Marks.model.js";

class MarkRepository extends CrudRepository {
  constructor() {
    super(Mark);
  }
}

export default MarkRepository;
