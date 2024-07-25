import TrainerRepository from "../repository/Trainer-Repository.js";

class TrainerService {
  constructor() {
    this.trainerRepository = new TrainerRepository();
  }

  async createTrainer(data) {
    try {
      const trainer = await this.trainerRepository.createTrainner(data);
      return trainer;
    } catch (error) {
      console.log("service layer error",error.message)
      if (error.message === "Trainer already exists") {
        throw new Error("Trainer already exists");
      }
      throw error;
    }
  }

  async getAllTrainer() {
    try {
      const trainers = await this.trainerRepository.getAll();
      return trainers;
    } catch (error) {
      throw error;
    }
  }

  async getTrainerById(trainerId) {
    try {
      const trainer = await this.trainerRepository.get(trainerId);
      return trainer;
    } catch (error) {
      throw error;
    }
  }

  async deleteTrainer(id) {
    try {
      const response = await this.trainerRepository.destroy(id);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** getinng all trainingpartner belongs to a individual

  async getAllTrainerBelongsToTrainingPartner(trainingPartnerId) {
    try {
      const response =
        await this.trainerRepository.fetchTrainersOfTrainingPartner(
          trainingPartnerId
        );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async uploadTResultSheet(trainerId, resultSheetUrl) {
    try {
      const trainer = await this.trainerRepository.get(trainerId);
      if (!trainer) {
        throw new Error("Trainer not Found");
      }
      trainer.resultSheet = resultSheetUrl;
      const response = await trainer.save();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

export default TrainerService;
