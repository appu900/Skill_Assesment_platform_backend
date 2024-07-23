import AssesmentAgencyPaymentInvoice from "../models/AssesmentAgencyMonthlyinvoice.js";
import CrudRepository from "./crud.repository.js";

class AssesmentMonthlyRepository extends CrudRepository {
  constructor() {
    super(AssesmentAgencyPaymentInvoice);
  }

  async getInvoiceByMonthAndYear(month, year) {
    try {
      const invoice = await AssesmentAgencyPaymentInvoice.findOne({
        month: month,
        year: year,
      });
      return invoice;
    } catch (error) {
      throw error;
    }
  }

  async getInvoiceFilter(assesmentAgencyId, month, year) {
    try {
      const response = await AssesmentAgencyPaymentInvoice.findOne({
        AssesmentAgencyId: assesmentAgencyId,
        month: month,
        year: year,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default AssesmentMonthlyRepository;
