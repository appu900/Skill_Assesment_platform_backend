import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const trainingPartnerSchema = new mongoose.Schema(
  {
    id: { type: String },
    username: { type: String, required: true, unique: true },
    head_owner_email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    Scheme: { type: String },
    TP_code: { type: String },
    center_id: { type: String },
    organization_name: { type: String },
    organization_category: { type: String },
    affiliation: { type: String },
    date_of_incorporation: { type: Date },
    registered_office_address: { type: String },
    registered_office_dist: { type: String },
    registered_office_city: { type: String },
    registered_office_state: { type: String },
    registered_office_pin: { type: Number },
    registered_office_telephone: { type: String },
    registered_office_mobile: { type: Number },
    registered_office_fax: { type: String },
    registered_office_email: { type: String },
    registered_office_gst: { type: String },
    regional_state_office_address: { type: String },
    regional_state_office_dist: { type: String },
    regional_state_office_city: { type: String },
    regional_state_office_state: { type: String },
    regional_state_office_pin: { type: Number },
    regional_state_office_telephone: { type: Number },
    regional_state_office_mobile: { type: Number },
    regional_stateoffice_fax: { type: String },
    regional_state_office_email: { type: String },
    regional_state_office_gst: { type: String },
    website: { type: String },
    pan: { type: String },
    prn_no: { type: String },
    head_owner_name: { type: String },
    head_owner_dob: { type: Date },
    head_owner_city: { type: String },
    head_owner_res_address: { type: String },
    head_owner_permanent_address: { type: String },
    head_owner_mobile: { type: Number },
    head_owner_alt_mobile: { type: Number },
    head_owner_qualification: { type: String },
    head_owner_work_experience: { type: String },
    head_owner_pan_no: { type: String },
    head_owner_aadhar_no: { type: String },
    head_owner_PROMOTER1: { type: String },
    head_owner_PROMOTER2: { type: String },
    head_owner_PROMOTER3: { type: String },
    project_contact_person_name: { type: String },
    project_contact_person_designation: { type: String },
    project_contact_person_city: { type: String },
    project_contact_person_mobile: { type: Number },
    project_contact_person_alt_mobile: { type: Number },
    project_contact_person_res_address: { type: String },
    project_contact_person_permanent_address: { type: String },
    project_contact_person_email: { type: String },
    project_contact_person_alt_email: { type: String },
    payment_status: { type: String },
    status: { type: String },
  },
  { timestamps: true }
);

const generatePassword = function () {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let index = 0; index < 10; index++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return password;
};

trainingPartnerSchema.pre("save", async function (next) {
  const trainingPartner = this;
  if (!trainingPartner.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const generatedPassword = generatePassword();
    console.log(generatedPassword);
    trainingPartner.password = await bcrypt.hash(generatedPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

trainingPartnerSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compareSync(inputPassword, this.password);
};

trainingPartnerSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, username: this.username }, "SECRET_KEY", {
    expiresIn: "1d",
  });
};

const TrainingPartner = mongoose.model(
  "TrainingPartner",
  trainingPartnerSchema
);
export default TrainingPartner;
