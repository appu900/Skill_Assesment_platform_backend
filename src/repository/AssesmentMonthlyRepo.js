import AssesmentAgencyPaymentInvoice from "../models/AssesmentAgencyMonthlyinvoice.js";
import CrudRepository from "./crud.repository.js";

class AssesmentMonthlyRepository extends CrudRepository {
  constructor() {
    super(AssesmentAgencyPaymentInvoice);
  }

  async getInvoiceFilter(assesmentAgencyId, month, year) {
    return AssesmentAgencyPaymentInvoice.findOne({
      AssesmentAgencyId: assesmentAgencyId,
      month: String(month),
      year: String(year),
    });
  }

  async getInvoiceOFAAssesmentAgency(assesmentAgencyId) {
    return AssesmentAgencyPaymentInvoice.find({ AssesmentAgencyId: assesmentAgencyId }).sort({
      _id: -1,
    });
  }

  async updateInvoicePdf(invoiceId, pdfUrl) {
    return AssesmentAgencyPaymentInvoice.findByIdAndUpdate(
      invoiceId,
      { $set: { invoicePdf: pdfUrl } },
      { new: true }
    );
  }

  async updateInvoicePaymentStatus(invoiceId, transactionId, amount) {
    return AssesmentAgencyPaymentInvoice.findByIdAndUpdate(
      invoiceId,
      {
        $set: {
          paymentStatus: true,
          transactionId: transactionId,
          paidAmount: amount,
          paymentDate: new Date().toISOString(),
        },
      },
      { new: true }
    );
  }

  async updateInvoiceById(invoiceId, data) {
    return AssesmentAgencyPaymentInvoice.findByIdAndUpdate(invoiceId, { $set: data }, { new: true });
  }
}

export default AssesmentMonthlyRepository;
