import InvoiceRepository from "../repository/InvoiceRepository.js";

class InvoiceService {
  constructor() {
    this.invoiceRepository = new InvoiceRepository();
  }
  async createInvoice(data) {
    try {
      const response = await this.invoiceRepository.create(data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getInvoiceByBatchId(batchId) {
    try {
      const response = await this.invoiceRepository.getByBatchId(batchId);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default InvoiceService;
