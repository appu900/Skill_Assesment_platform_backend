import TrainingPartner from "../models/TrainingPartner.model.js";
import CrudRepository from "./crud.repository.js";

class TrainingPartnerRepository extends CrudRepository {
  constructor() {
    super(TrainingPartner);
  }

  async updateStatusApproved(trainingPartnerId) {
    try {
      const res = await TrainingPartner.findByIdAndUpdate(
        trainingPartnerId,
        {
          $set: {
            applicationStatus: "Approved",
          },
        },
        { new: true }
      );
      return res;
    } catch (error) {
      throw error;
    }
  }

  async updateStatusRejected(trainingPartnerId) {
    try {
      const res = await TrainingPartner.findByIdAndUpdate(
        trainingPartnerId,
        {
          $set: {
            applicationStatus: "Rejected",
          },
        },
        { new: true }
      );
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default TrainingPartnerRepository;
