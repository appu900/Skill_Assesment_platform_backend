import CrudRepository from "./crud.repository.js";
import Center from "../models/Center.js";

class CenterRepository extends CrudRepository {
  constructor() {
    super(Center);
  }

  async getCenterByTrainingPartnerId(trainingPartnerId) {
    try {
      const response = await Center.find({
        trainingOrganizationId: trainingPartnerId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterCenters(queryObject){
    try {
      const response = await Center.find(queryObject);
      return response;
    } catch (error) {
      throw error;
    }
  }

  
}

export default CenterRepository;
