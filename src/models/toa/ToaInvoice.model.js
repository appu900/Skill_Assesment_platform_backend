import mongoose from "mongoose";

const lineSchema = new mongoose.Schema({ description: String, quantity: Number, rate: Number, amount: Number }, { _id: false });

const toaInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    // ** one live invoice per batch; a cancelled invoice moves its batch to cancelledBatch
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "ToaBatch", default: undefined },
    cancelledBatch: { type: mongoose.Schema.Types.ObjectId, ref: "ToaBatch", default: null },
    cancelReason: { type: String, default: null },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainingPartner", required: true, index: true },
    // ** payer as it was on the invoice date
    payer: { organizationName: String, tpCode: String, address: String, state: String, gstNumber: String, email: String },
    feeMode: { type: String, enum: ["per_assessor", "per_batch"] },
    lines: [lineSchema],
    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    status: { type: String, enum: ["unpaid", "paid", "cancelled", "refunded"], default: "unpaid", index: true },
    paidAt: { type: Date, default: null },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "ToaPayment", default: null },
  },
  { timestamps: true, collection: "toa_invoices" }
);

toaInvoiceSchema.index({ batch: 1 }, { unique: true, partialFilterExpression: { batch: { $type: "objectId" } } });

const ToaInvoice = mongoose.model("ToaInvoice", toaInvoiceSchema);
export default ToaInvoice;
