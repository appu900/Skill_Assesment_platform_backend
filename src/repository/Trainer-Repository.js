import CrudRepository from "./crud.repository.js";
import Trainer from "../models/Trainer.model.js";

class TrainerRepository extends CrudRepository {
  constructor() {
    super(Trainer);
  }
}

export default TrainerRepository;
