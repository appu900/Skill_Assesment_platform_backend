import mongoose from "mongoose";

const monthlyInvoiceSchema = new mongoose.Schema(
  {
    AssesmentAgencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssesmentAgency",
    },
    invoiceGenerateDate: {
      type: String,
    },
    examDetails: [
      {
        batchAbn: String,
        tpname: String,
        assesmentDate: String,
        totalNoOfCandidates: Number,
        noOfAssessedCandidates: Number,
        costPerCandidate: Number,
        amountToPaid: Number,
      },
    ],

    totalNoOfcandidates: {
      type: Number,
    },

    totalNoOfAssessedCandidates: {
      type: Number,
    },

    AssesmentAgencyDetails: {
      name: {
        type: String,
      },
      PAN: {
        type: String,
      },
      contactNumber: {
        type: String,
      },
      address: {
        type: String,
      },
      GST_Number: {
        type: String,
      },
    },

    BankInformation: {
      accountNumber: {
        type: String,
      },
      bankName: {
        type: String,
      },
      branchName: {
        type: String,
      },
      IFSCCode: {
        type: String,
      },
    },
    totalAmountToBePaid: {
      type: Number,
    },
    paidAmount: {
      type: Number,
      default:0,
    },
    paymentDate: {
      type: String,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
    },
    month: {
      type: String,
    },
    year: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    invoicePdf: {
      type: String,
    },
  },
  { timestamps: true }
);

const AssesmentAgencyPaymentInvoice = new mongoose.model(
  "AssesmentAgencyPaymentInvoice",
  monthlyInvoiceSchema
);
export default AssesmentAgencyPaymentInvoice;
