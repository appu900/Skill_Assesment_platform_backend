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
  // ** batch payment invoice shown to the training partner after it submits a batch (client, 2026-11-24)
  invoiceNumber: { type: String },
  issuedAt: { type: Date },
  candidates: { type: Number },
  ratePerCandidate: { type: Number },
  subtotal: { type: Number },
  gstPercent: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  // ** true when the batch is sent back to the training partner before payment; a resubmission revives it
  cancelled: { type: Boolean, default: false },
  cancelReason: { type: String },
},
{
  timestamps: true,
});

invoiceSchema.index({ BatchId: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true, partialFilterExpression: { invoiceNumber: { $type: "string" } } });
invoiceSchema.index({ TrainingPartnerId: 1, createdAt: -1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
