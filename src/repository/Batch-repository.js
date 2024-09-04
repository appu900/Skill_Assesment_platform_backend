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

  async activateBatchByClient(batchId, paymentAmount, perStudentCost) {
    try {
      const response = await Batch.findByIdAndUpdate(batchId, {
        batchActivePermission: true,
        amountToPaid: paymentAmount,
        perStudentCost: perStudentCost,
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

  async updateCorporatePaymentAmount(batchId, amount) {
    try {
      const response = await Batch.findByIdAndUpdate(batchId, {
        amountToPaid: amount,
      });
      return response.amountToPaid;
    } catch (error) {
      throw error;
    }
  }

  // ** get payemnt for a batch by admin
  async getAllBatchByCorporatePayment() {
    try {
      const response = await Batch.find({
        corporatePaymentType: true,
        paymentStatus: false,
        clientPaymentStatus: false,
        batchActivePermission: true,
        amountToPaid: { $ne: 0 },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getBatchesByPendingPayment() {
    try {
      const response = await Batch.find({
        paymentStatus: false,
        clientPaymentStatus: true,
        batchActivePermission: true,
        amountToPaid: { $ne: 0 },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** new endpoint for getting all the batches that are approved by the government body
  async getAllGovernmentBatchesPendingPaymentData() {
    try {
      const response = await Batch.find({
        approvedByGovernmentBody: true,
        paymentStatus: false,
        clientPaymentStatus: true,
        batchActivePermission: true,
        amountToPaid: { $ne: 0 },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** get all the batches by a spcific scheme name

  async getBatchesBySchemeName(schemeName,state) {
    try {
      const response = await Batch.find({ scheme: schemeName,state:state,
        batchActivePermission:true, });
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
