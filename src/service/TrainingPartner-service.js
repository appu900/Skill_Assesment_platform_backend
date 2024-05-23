import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";

class TrainingPartnerService {
  constructor() {
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  async createTrainingPartner(data) {
    try {
      const res = await this.trainingPartnerRepository.create(data);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async updateTrainingPartner(id, data) {
    try {
      const res = await this.trainingPartnerRepository.update(id, data);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getTrainingPartnerById(id) {

    try {
      const res = await this.trainingPartnerRepository.getById(id);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getAllTrainingPartner() {
    try {
      const res = await this.trainingPartnerRepository.getAll();

      return res;
    } catch (error) {
      throw error;
    }
  }

  async deleteTrainingPartner(id) {
    try {
      await this.trainingPartnerRepository.destroy(id);
    } catch (error) {
      throw error;
    }
  }
}

export default TrainingPartnerService;
