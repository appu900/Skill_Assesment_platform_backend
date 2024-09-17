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

  MPR_ID:{
    type:String,
    required:true
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
    required:true
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

  studentDOB: {
    type: String,
    required: true,
  },

  studentProfilePic: {
    type: String,
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  Nos: [
    {
      name: String,
      nosType:String,
      code:String,
      Theory: Number,
      Practical: Number,
      Total: Number,
      passMark: Number,
      MarksObtained: Number,
    },
  ],   

  total: {
    type: Number,
    required: true,
  },

  totalTheorymark:{
    type: Number,
    required: true,
  },

  totalPracticalMark:{
    type: Number,
    required: true,
  },
  
  totalVivaMark:{
    type: Number,
    required: true,
  },

  Grade:{
    type: String,
    required: [true,"Grade is required"]
  },
  
  Result: {
    type: String,
    required: true,
    enum: ["Pass", "Fail"],
  },
});

const Mark = new mongoose.model("Mark", markSchema);
export default Mark;
