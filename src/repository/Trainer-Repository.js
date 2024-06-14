import CrudRepository from "./crud.repository.js";
import Trainer from "../models/Trainer.model.js";

class TrainerRepository extends CrudRepository {
  constructor() {
    super(Trainer);
  }

  async fetchTrainersOfTrainingPartner(trainingPartnerId) {
    try {
      const response = await Trainer.find({
        trainingPartner: trainingPartnerId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default TrainerRepository;
