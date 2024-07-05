import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },

  courseName: {
    type: String,
    required: true,
  },

  TrainingPartner: {
    type: String,
    required: true,
  },

  AssesmentAgencyName: {
    type: String,
    required: true,
  },

  studentAttendance: {
    type: Boolean,
    required: true,
  },

  batchABN: {
    type: String,
    required: true,
  },

  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
  },
  examDate: {
    type: Date,
  },

  centerCode: {
    type: String,
    required: true,
  },

  sectorName: {
    type: String,
    required: true,
  },

  studentRedgNo: {
    type: String,
    required: true,
  },

  studentName: {
    type: String,
    required: true,
  },

  studentId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  Theory: {
    type: Number,
    required: true,
  },

  practical: {
    type: Number,
    required: true,
  },

  viva: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },

  Result: {
    type: String,
    required: true,
    enum: ["Pass", "Fail"],
  },
});

const Mark = new mongoose.model("Mark", markSchema);
export default Mark;
