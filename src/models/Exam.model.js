import mongoose from "mongoose";


// ** batchId -> ABN number of the training partner
// **  request -> batch

const examSchema = new mongoose.Schema(
  {
    batchABN:{
      type: String,
      required: true
    },
    course: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      default: "not-started",
      enum: ["not-started", "completed"],
    },
    scheme: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    assesmentAgencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssesmentAgency",
      required: true,
    },
    assesmentAgency: {
      type: String,
      required: true,
    },
    TrainingOrganization: {
      type: String,
      required: true,
    },
    TrainingPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingPartner",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = new mongoose.model("Exam", examSchema);
export default Exam;












