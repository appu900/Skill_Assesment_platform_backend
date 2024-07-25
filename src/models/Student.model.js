import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    markUploadStatus:{
      type: Boolean,
      default: false,
    },
    fathername: {
      type: String,
      required: [true, "Father's name is required"],
    },
    mothername: {
      type: String,
      required: [true, "Mother's name is required"],
    },
    dob: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
    },
    religion: {
      type: String,
      required: [true, "Religion is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    nationality: {
      type: String,
      required: [true, "Nationality is required"],
    },
    generalqualification: {
      type: String,
      required: [true, "General Qualification is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    district: {
      type: String,
      required: [true, "District is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    sector_name: {
      type: String,
      required: [true, "Sector name is required"],
    },
    course: {
      type: String,
      required: [true, "Course is required"],
    },
    module: {
      type: String,
      required: [true, "Module is required"],
    },
    uid: {
      type: String,
      required: [true, "UID is required"],
    },
    traininstartdate: {
      type: Date,
      required: [true, "Training start date is required"],
    },
    trainingenddate: {
      type: Date,
      required: [true, "Training end date is required"],
    },
    trainingHours: {
      type: Number,
      required: [true, "Training hours are required"],
    },
    totalhours: {
      type: Number,
      required: [true, "Total hours are required"],
    },
    totaldays: {
      type: Number,
      required: [true, "Total days are required"],
    },
    cenid: {
      type: String,
      required: [true, "Center ID is required"],
    },
    profilepic: {
      type: String,
      required: false,
    },
    trainingPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingPartner",
    },
    enrolledBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },
    marks: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mark",
    },
    absent: {
      type: Boolean,
      default: false,
    },
    certificate:{
      type:String
    },
   
    Grade:{
      type:String,
    },
    redg_No: {
      type: String,
      // required: [true, "Registration number is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model("Student", StudentSchema);
export default Student;
