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
}

export default InvoiceService;  
