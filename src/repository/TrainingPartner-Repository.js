import TrainingPartner from "../models/TrainingPartner.model.js";
import CrudRepository from "./crud.repository.js";

class TrainingPartnerRepository extends CrudRepository {
  constructor() {
    super(TrainingPartner); // Ensure the model is correctly passed to the parent class constructor
  }

  async findByEmail(email) {
    try {
      const result = await TrainingPartner.findOne({ head_owner_email: email });
      return result;
    } catch (error) {
      throw new Error("Error finding training partner by email");
    }
  }
}

export default TrainingPartnerRepository;
