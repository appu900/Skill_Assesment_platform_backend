import mongoose from "mongoose";

const assessorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  AssesmentAgency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssesmentAgency",
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  education_qualification_1: {
    type: String,
    required: true,
  },
  education_qualification_2: {
    type: String,
    required: true,
  },
  education_qualification_3: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
  other_experience: {
    type: String,
    required: true,
  },
  adharNumber: {
    type: String,
    required: true,
  },
  panNumber: {
    type: String,
    required: true,
  },
  assesoraId: {
    type: String,
    required: true,
  },
  dist: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  certified_In_Any_course: {
    type: String,
  },
  courseCode: {
    type: String,
    required: true,
  },
  sector: {
    type: String,
    required: true,
  },
  enrolledInAnyOtherAssesmentAgency: {
    type: String,
    required: true,
    enum: ["Yes", "No"],
  },
  enrolledInAnyOtherSSC: {
    type: String,
    required: true,
    enum: ["Yes", "No"],
  },
  profilePic: {
    type: String,
  },
});

const Assessor = mongoose.model("Assessor", assessorSchema);

export default Assessor;




// ** this model will be created by Assesment Agency 
// ** need to verify authorization before creating this model