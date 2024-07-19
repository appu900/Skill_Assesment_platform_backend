import CenterRepository from "../repository/Center-repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";

class CenterService {
  constructor() {
    this.centerRepository = new CenterRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  async create(data) {
    try {
      const tp = await this.trainingPartnerRepository.get(
        data.trainingOrganizationId
      );
      if (!tp) {
        throw new Error("Training partner not found");
      }
      const center = await this.centerRepository.create(data);
      tp.centers.push(center);
      await tp.save();
      return center;
    } catch (error) {
      throw error;
    }
  }
}

export default CenterService;
