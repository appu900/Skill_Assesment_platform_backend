import Invoice from "../models/invoice.model.js";
import CrudRepository from "./crud.repository.js";

class InvoiceRepository extends CrudRepository {
  constructor() {
    super(Invoice);
  }

  async getByBatchId(batchId) {
    return Invoice.findOne({ BatchId: batchId });
  }
}

export default InvoiceRepository;
