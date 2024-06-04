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
}

export default TrainerService;


