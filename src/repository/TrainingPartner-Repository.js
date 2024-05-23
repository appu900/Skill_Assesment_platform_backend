import CrudRepository from "./crud.repository.js";
import TrainingPartner from "../models/TrainingPartner.model.js";

class TrainingPartnerRepository extends CrudRepository {
  constructor() {
    super(TrainingPartner);
  }
}

export default TrainingPartnerRepository;
