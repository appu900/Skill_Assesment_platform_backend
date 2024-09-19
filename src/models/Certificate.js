import mongoose from "mongoose";
import CertificateCouter from "./CertficateSequence.js";

const certificateSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  stutentProfilePic: {
    type: String,
  },
  batchId: {
    type: String,
  },
  fatherName: {
    type: String,
    required: true,
  },
  DOB: {
    type: String,
    required: true,
  },
  Enrolment_number: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  credit: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  TrainingCenter: {
    type: String,
    required: true,
  },
  District: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  schemeLogo: {
    type: String,
  },
  placeOfIssue: {
    type: String,
    default: "Bhubaneswar",
  },
  DateOfIssue: {
    type: String,
  },
  certificateCode: {
    type: String,
  },
});

certificateSchema.pre("save", async function (next) {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const seq = await CertificateCouter.findByIdAndUpdate(
    "s1",
    {
      $inc: { counter: 1 },
    },
    { new: true, upsert: true }
  );

  this.certificateCode = `CUTM${year}${month}${seq.counter}`;
  next();
});

const StudentCertificate = new mongoose.model(
  "StudentCertificate",
  certificateSchema
);
export default StudentCertificate;
