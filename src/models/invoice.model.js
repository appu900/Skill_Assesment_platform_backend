import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  payer: {
    type: String,
  },
  payee: {
    type: String,
  },
  purpose: {
    type: String,
  },
  payAbleamount: {
    type: Number,
  },
  paidAmount: {
    type: Number,
  },
  paymentStatus: {
    type: Boolean,
    default: false,
  },
  paymentDate: {
    type: Date,
  },
  TrainingPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainingPartner",
  },
  AssesmentAgencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssesmentAgency",
  },
  BatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
  },

  // onModel: {
  //   type: String,
  //   enum: ["TrainingPartner", "Admin", "AssesmentAgency"],
  // },
  // modelId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   refPath: "onModel",
  // },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
