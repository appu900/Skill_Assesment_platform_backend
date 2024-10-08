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

  async getInvoiceOFAAssesmentAgency(assesmentAgencyId) {
    try {
      const response = await AssesmentAgencyPaymentInvoice.find({
        AssesmentAgencyId: assesmentAgencyId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateInvoicePdf(invoiceId, pdfUrl) {
    try {
      const response = await AssesmentAgencyPaymentInvoice.findByIdAndUpdate(
        invoiceId,
        {
          $set: {
            invoicePdf: pdfUrl,
          },
        },
        { new: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateInvoicePaymentStatus(invoiceId, transactionId, amount) {
    try {
      const response = await AssesmentAgencyPaymentInvoice.findByIdAndUpdate(
        invoiceId,
        {
          $set: {
            paymentStatus: true,
            transactionId: transactionId,
            paidAmount: amount,
          },
        },
        { new: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateInvoiceById(invoiceId, data) {
    try {
      console.log("Repository called")
      const updatedInvoice =
        await AssesmentAgencyPaymentInvoice.findByIdAndUpdate(
          invoiceId,
          { $set: data },
          { new: true }
        );
      if (!updatedInvoice) {
        throw new Error("Invoice not found");
      }
      return updatedInvoice;
    } catch (error) {
      console.log("Error in updating Data", error.message);
      throw error;
    }
  }
}

export default AssesmentMonthlyRepository;
