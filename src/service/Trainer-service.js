import TrainerRepository from "../repository/Trainer-Repository.js";

class TrainerService {
  constructor() {
    this.trainerRepository = new TrainerRepository();
  }

  async createTrainer(data) {
    try {
      const trainer = await this.trainerRepository.create(data);
      return trainer;
    } catch (error) {
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
}

export default TrainerService;
