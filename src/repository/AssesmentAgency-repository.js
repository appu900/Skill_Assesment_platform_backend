import CrudRepository from "./crud.repository.js";
import AssesmentAgency from "../models/AssesmentAgency.js";

class AssesmentAgencyRepository extends CrudRepository {
  constructor() {
    super(AssesmentAgency);
  }

  async filterData(queryObject) {
    try {
      const response = await AssesmentAgency.find(queryObject);
      return response;
    } catch (error) {
      throw error;
    }
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

  async updateStatusApproved(assesmentAgencyId, amountPercentange) {
    try {
      const res = await AssesmentAgency.findByIdAndUpdate(
        assesmentAgencyId,
        {
          $set: {
            applicationStatus: "Approved",
            paymentPercentage: amountPercentange,
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

  async getAllApprovedApplications() {
    try {
      const response = await AssesmentAgency.find({
        applicationStatus: "Approved",
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllPendingApplications() {
    try {
      const response = await AssesmentAgency.find({
        applicationStatus: "Pending",
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateBankDetails(
    assesmentAgencyId,
    accountNumber,
    IFSC_Code,
    bankName,
    branchName,
  
  ) {
    try {
      const response = await AssesmentAgency.findByIdAndUpdate(
        assesmentAgencyId,
        {
          $set: {
            AccountNumber: accountNumber,
            IFSC_Code: IFSC_Code,
            BankName: bankName,
            BranchName: branchName,
          },
        },
        { new: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default AssesmentAgencyRepository;
