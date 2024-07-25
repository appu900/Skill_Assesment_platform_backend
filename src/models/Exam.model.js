import mongoose from "mongoose";

// ** batchId -> ABN number of the training partner
// **  request -> batch
// **  response -> batch

const examSchema = new mongoose.Schema(
  {
    batchABN: {
      type: String,
      required: true,
    },

    certificateIssued:{
      type: Boolean,
      default: false,
    },

    batchPaymentAmount: {
      type: Number,
    },
    markUploadAndExamCompleteStatus: {
      type: Boolean,
      default: false,
    },
    course: { type: String, required: true },
    courseCode: { type: String },
    courseCredit: { type: String },
    courseLevel: { type: String },
    CenterName: {
      type: String,
    },
    CenterCode: {
      type: String,
    },
    assesmentdate: { type: String },
    month: {
      type: String,
    },
    year: {
      type: String,
    },
    status: {
      type: String,
      default: "not-started",
      enum: ["not-started", "completed"],
    },
    scheme: {
      type: String,
      required: true,
    },
    tpcode: {
      type: String,
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
    AssessorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessor",
    },
    totalStudents: {
      type: Number,
    },
    presentStudents: {
      type: Number,
    },
    totalNoOfStudentAbsent: {
      type: Number,
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },

    attendanceSheet: {
      type: String,
    },
    resultSheet: {
      type: String,
    },
    perStudentCost: {
      type: Number,
    },

    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Exam = new mongoose.model("Exam", examSchema);
export default Exam;

// end point of
