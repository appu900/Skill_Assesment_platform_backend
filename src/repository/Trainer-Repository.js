import CrudRepository from "./crud.repository.js";
import Trainer from "../models/Trainer.model.js";
import mongoose from "mongoose";

class TrainerRepository extends CrudRepository {
  constructor() {
    super(Trainer);
  }

  async createTrainner(data) {
    try {
      const trainer = await Trainer.findOne({ email: data.email });
      if (trainer) {
        throw new Error("Trainer already exists");
      }
      else{
        const response = await Trainer.create(data);
        return response;
      }
    } catch (error) {
      throw error;
    }
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
