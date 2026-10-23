import CrudRepository from "./crud.repository.js";
import Trainer from "../models/Trainer.model.js";
import AppError from "../utils/AppError.js";

class TrainerRepository extends CrudRepository {
  constructor() {
    super(Trainer);
  }

  async createTrainner(data) {
    const trainer = await Trainer.findOne({ email: String(data.email) });
    if (trainer) {
      throw AppError.conflict("Trainer already exists");
    }
    return Trainer.create(data);
  }

  async fetchTrainersOfTrainingPartner(trainingPartnerId) {
    return Trainer.find({ trainingPartner: trainingPartnerId });
  }
}

export default TrainerRepository;
