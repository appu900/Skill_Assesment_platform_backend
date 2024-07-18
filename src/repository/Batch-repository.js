import Batch from "../models/Batch.model.js";
import CrudRepository from "./crud.repository.js";

class BatchRepository extends CrudRepository {
  constructor() {
    super(Batch);
  }

  async getAllBatches() {
    try {
      const response = await Batch.find();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getBatchDetails(batchId) {
    try {
      const batch = await Batch.findById(batchId)
        .populate("students")
        .populate("trainers");

      return batch;
    } catch (error) {
      throw error;
    }
  }

  async getAllbatchesForAnIndividualTrainingPartner(id) {
    try {
      const response = await Batch.find({
        trainingOrganizationId: id,
      })
        .populate("students")
        .populate("trainers");
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterData(queryObject) {
    try {
      const response = await Batch.find(queryObject);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** update payment status of a batch from a clinet
  async updateClientPaymentStatus(batchId, preInvoiceUrl, postInvoiceUrl) {
    try {
      const response = await Batch.findByIdAndUpdate(batchId, {
        clientPaymentStatus: true,
        prePaymentInvoice: preInvoiceUrl,
        postPaymentInvoice: postInvoiceUrl,
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // ** update payment status of a batch from admin

  async updatePayamentStatus(batchId) {
    try {
      const response = await Batch.findByIdAndUpdate(batchId, {
        paymentStatus: true,
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async activateBatchByClient(batchId) {
    try {
      const response = await Batch.findByIdAndUpdate(batchId, {
        batchActivePermission: true,
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async assignPriceToBatch(batchId, amount) {
    try {
      const response = await Batch.findByIdAndUpdate(batchId, {
        amountToPaid: amount,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * first create batch
   * then as a updating state -> create students
   * add store the ids of the student in student array
   *
   */
}

export default BatchRepository;
