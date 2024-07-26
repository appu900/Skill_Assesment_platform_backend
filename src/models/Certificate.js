import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  studentId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  stutentProfilePic:{
    type:String
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
  placeOfIssue: {
    type: String,
    default: "Bhubaneswar",
  },
  DateOfIssue: {
    type: String,
  },
});

const StudentCertificate = new mongoose.model(
  "StudentCertificate",
  certificateSchema
);
export default StudentCertificate;
