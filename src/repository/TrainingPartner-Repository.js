import TrainingPartner from "../models/TrainingPartner.model.js";
import CrudRepository from "./crud.repository.js";

class TrainingPartnerRepository extends CrudRepository {
  constructor() {
    super(TrainingPartner);
  }
}

export default TrainingPartnerRepository;
