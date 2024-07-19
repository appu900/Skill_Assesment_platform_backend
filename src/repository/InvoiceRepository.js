import Invoice from "../models/invoice.model.js";
import CrudRepository from "./crud.repository.js";

class InvoiceRepository extends CrudRepository {
  constructor() {
    super(Invoice);
  }

  async getByBatchId(batchId) {
    try {
      const response = await Invoice.findOne({ BatchId: batchId });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default InvoiceRepository;
