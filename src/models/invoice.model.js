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
  amount: {
    type: Number,
  },
 
  paymentStatus: {
    type: Boolean,
    default: false,
  },
  paymentDate: {
    type: Date,
  },
  UTR: {
    type: String,
  },
  transactionId: {
    type: String,
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
},
{
  timestamps: true,
});

invoiceSchema.index({ BatchId: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
