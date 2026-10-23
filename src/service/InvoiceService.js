import InvoiceRepository from "../repository/InvoiceRepository.js";

class InvoiceService {
  constructor() {
    this.invoiceRepository = new InvoiceRepository();
  }

  async createInvoice(data) {
    return this.invoiceRepository.create(data);
  }

  async getInvoiceByBatchId(batchId) {
    return this.invoiceRepository.getByBatchId(batchId);
  }

  // ** one invoice per batch, created on first use and updated afterwards
  async upsertBatchInvoice(batchId, data) {
    const invoice = await this.invoiceRepository.getByBatchId(batchId);
    if (invoice) {
      return this.invoiceRepository.update(invoice._id, data);
    }
    return this.invoiceRepository.create(data);
  }
}

export default InvoiceService;
