import TrainingPartner from "../models/TrainingPartner.model.js";
import CrudRepository from "./crud.repository.js";

class TrainingPartnerRepository extends CrudRepository {
  constructor() {
    super(TrainingPartner);
  }

  async updateStatusApproved(trainingPartnerId, paymentAmount) {
    return TrainingPartner.findByIdAndUpdate(
      trainingPartnerId,
      {
        $set: {
          applicationStatus: "Approved",
          organizationCorporatePaymentFee: paymentAmount,
        },
      },
      { new: true }
    );
  }

  async updateStatusRejected(trainingPartnerId) {
    return TrainingPartner.findByIdAndUpdate(
      trainingPartnerId,
      { $set: { applicationStatus: "Rejected" } },
      { new: true }
    );
  }

  async findByEmail(email) {
    return TrainingPartner.findOne({ registeredOfficeEmail: String(email) });
  }

  async updateEmail(id, email) {
    return TrainingPartner.findByIdAndUpdate(
      id,
      { registeredOfficeEmail: email },
      { new: true, runValidators: true }
    );
  }

  async getNewPendingRequests() {
    return TrainingPartner.find({ applicationStatus: "Pending" });
  }

  async getApprovedApplications() {
    return TrainingPartner.find({ applicationStatus: "Approved" });
  }

  async filterData(query) {
    return TrainingPartner.find(query);
  }
}

export default TrainingPartnerRepository;
