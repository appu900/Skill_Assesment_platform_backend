import CrudRepository from "./crud.repository.js";
import AssesmentAgency from "../models/AssesmentAgency.js";

class AssesmentAgencyRepository extends CrudRepository {
  constructor() {
    super(AssesmentAgency);
  }

  async findUserByEmail(email) {
    try {
      const assesmentAgency = await AssesmentAgency.findOne({
        email: email,
      });
      return assesmentAgency;
    } catch (error) {
      throw error;
    }
  }

  async updateStatusApproved(assesmentAgencyId) {
    try {
      const res = await AssesmentAgency.findByIdAndUpdate(
        assesmentAgencyId,
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

  async updateStatusRejected(assesmentAgencyId) {
    try {
      const res = await AssesmentAgency.findByIdAndUpdate(
        assesmentAgencyId,
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



export default AssesmentAgencyRepository;
