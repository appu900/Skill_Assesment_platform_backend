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

  async findByEmail(email) {
    try {
      console.log(email);
      const response = await TrainingPartner.findOne({
        registeredOfficeEmail: email,
      });
      console.log(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getNewPendingRequests() {
    try {
      const response = await TrainingPartner.find({
        applicationStatus: "Pending",
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getApprovedApplications() {
    try {
      const response = await TrainingPartner.find({
        applicationStatus: "Approved",
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterDataBysectorAndCourse(sectorName, courseName) {
    try {
      const response = await TrainingPartner.find({
        sector: {
          $in: [sectorName],
        },
        courses: {
          $in: [courseName],
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterData(query) {
    try {
      const res = await TrainingPartner.find(query);
      return res;
    } catch (error) {
      throw error;
    }
  }


}

export default TrainingPartnerRepository;
