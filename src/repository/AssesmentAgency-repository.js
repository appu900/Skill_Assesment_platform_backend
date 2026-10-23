import CrudRepository from "./crud.repository.js";
import AssesmentAgency from "../models/AssesmentAgency.js";

class AssesmentAgencyRepository extends CrudRepository {
  constructor() {
    super(AssesmentAgency);
  }

  async filterData(queryObject) {
    return AssesmentAgency.find(queryObject);
  }

  async findUserByEmail(email) {
    return AssesmentAgency.findOne({ email: String(email) });
  }

  async updateStatusApproved(assesmentAgencyId, amountPercentange) {
    return AssesmentAgency.findByIdAndUpdate(
      assesmentAgencyId,
      { $set: { applicationStatus: "Approved", paymentPercentage: amountPercentange } },
      { new: true, runValidators: true }
    );
  }

  async updateStatusRejected(assesmentAgencyId) {
    return AssesmentAgency.findByIdAndUpdate(
      assesmentAgencyId,
      { $set: { applicationStatus: "Rejected" } },
      { new: true }
    );
  }

  async getAllApprovedApplications() {
    return AssesmentAgency.find({ applicationStatus: "Approved" });
  }

  async getAllPendingApplications() {
    return AssesmentAgency.find({ applicationStatus: "Pending" });
  }

  async updateBankDetails(assesmentAgencyId, accountNumber, IFSC_Code, bankName, branchName) {
    return AssesmentAgency.findByIdAndUpdate(
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
  }
}

export default AssesmentAgencyRepository;
