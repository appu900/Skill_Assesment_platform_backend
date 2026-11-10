import Batch from "../models/Batch.model.js";
import CrudRepository from "./crud.repository.js";
import { applyPagination } from "../utils/pagination.js";

class BatchRepository extends CrudRepository {
  constructor() {
    super(Batch);
  }

  async getAllBatches(pagination = null) {
    return applyPagination(Batch.find().sort({ _id: -1 }), pagination);
  }

  async getBatchDetails(batchId) {
    return Batch.findById(batchId).populate("students").populate("trainers");
  }

  async getAllbatchesForAnIndividualTrainingPartner(id) {
    return Batch.find({ trainingOrganizationId: id })
      .sort({ _id: -1 })
      .populate("students")
      .populate("trainers");
  }

  async filterData(queryObject) {
    return Batch.find(queryObject).sort({ _id: -1 });
  }

  // ** update payment status of a batch from admin
  async updatePayamentStatus(batchId) {
    return Batch.findByIdAndUpdate(batchId, { paymentStatus: true }, { new: true });
  }

  async activateBatchByClient(batchId, paymentAmount, perStudentCost) {
    return Batch.findByIdAndUpdate(
      batchId,
      {
        batchActivePermission: true,
        amountToPaid: paymentAmount,
        perStudentCost: perStudentCost,
        // ** a resubmitted batch starts a fresh SNA review
        rejectedByGovernmentBody: false,
        governmentRejectionReason: null,
      },
      { new: true }
    );
  }

  // ** corporate batches waiting for the admin to fix the payment amount
  async getAllBatchByCorporatePayment() {
    return Batch.find({
      schemeType: "Corporate",
      paymentStatus: false,
      clientPaymentStatus: false,
      batchActivePermission: true,
      amountToPaid: { $ne: 0 },
    });
  }

  async getBatchesByPendingPayment() {
    return Batch.find({
      paymentStatus: false,
      clientPaymentStatus: true,
      batchActivePermission: true,
      amountToPaid: { $ne: 0 },
    });
  }

  // ** government batches approved by the SNA that still wait for payment approval
  async getAllGovernmentBatchesPendingPaymentData() {
    return Batch.find({
      approvedByGovernmentBody: true,
      paymentStatus: false,
      clientPaymentStatus: true,
      batchActivePermission: true,
      amountToPaid: { $ne: 0 },
    });
  }

  async getBatchesBySchemeName(schemeName, state) {
    return Batch.find({
      scheme: schemeName,
      state: state,
      batchActivePermission: true,
    })
      .populate("students")
      .populate("trainers");
  }
}

export default BatchRepository;
