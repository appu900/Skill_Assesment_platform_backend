import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const traningPartnerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    username: {
      type: String,
      required: [true, "username is Required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
    },
    Scheme: {
      type: String,
    },
    TP_code: {
      type: String,
    },
    center_id: {
      type: String,
    },
    organization_name: {
      type: String,
    },
    organization_category: {
      type: String,
    },
    affiliation: {
      type: String,
    },
    date_of_incorporation: {
      type: String,
    },
    registered_office_address: {
      type: String,
    },
    registered_office_dist: {
      type: String,
    },
    registered_office_city: {
      type: String,
    },
    registered_office_state: {
      type: String,
    },
    registered_office_pin: {
      type: String,
    },
    registered_office_telephone: {
      type: String,
    },
    registered_office_mobile: {
      type: String,
    },
    registered_office_fax: {
      type: String,
    },
    registered_office_email: {
      type: String,
    },
    registered_office_gst: {
      type: String,
    },
    regional_state_office_address: {
      type: String,
    },
    regional_state_office_dist: {
      type: String,
    },
    regional_state_office_city: {
      type: String,
    },
    regional_state_office_state: {
      type: String,
    },
    regional_state_office_pin: {
      type: String,
    },
    regional_state_office_telephone: {
      type: String,
    },
    regional_state_office_mobile: {
      type: String,
    },
    regional_stateoffice_fax: {
      type: String,
    },
    regional_state_office_email: {
      type: String,
    },
    regional_state_office_gst: {
      type: String,
    },
    website: {
      type: String,
    },
    pan: {
      type: String,
    },
    prn_no: {
      type: String,
    },
    head_owner_name: {
      type: String,
    },
    head_owner_dob: {
      type: String,
    },
    head_owner_city: {
      type: String,
    },
    head_owner_res_address: {
      type: String,
    },
    head_owner_permanent_address: {
      type: String,
    },
    head_owner_mobile: {
      type: String,
    },
    head_owner_alt_mobile: {
      type: String,
    },
    head_owner_email: {
      type: String,
    },
    head_owner_qualification: {
      type: String,
    },
    head_owner_work_experience: {
      type: String,
    },
    head_owner_pan_no: {
      type: String,
    },
    head_owner_aadhar_no: {
      type: String,
    },
    head_owner_PROMOTER1: {
      type: String,
    },
    head_owner_PROMOTER2: {
      type: String,
    },
    head_owner_PROMOTER3: {
      type: String,
    },
    project_contact_person_name: {
      type: String,
    },
    project_contact_person_designation: {
      type: String,
    },
    project_contact_person_city: {
      type: String,
    },
    project_contact_person_mobile: {
      type: String,
    },
    project_contact_person_alt_mobile: {
      type: String,
    },
    project_contact_person_res_address: {
      type: String,
    },
    project_contact_person_permanent_address: {
      type: String,
    },
    project_contact_person_email: {
      type: String,
    },
    project_contact_person_alt_email: {
      type: String,
    },
    payment_status: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

/* Hashing password before save the instance to database */
traningPartnerSchema.pre("save", function (next) {
  const traningPartner = this;
  const SALT = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(traningPartner.password, SALT);
  traningPartner.password = hashedPassword;
  next();
});

traningPartnerSchema.methods.comparePassword = function compare(inputPassword) {
  return bcrypt.compareSync(inputPassword, this.password);
};

traningPartnerSchema.methods.generateJwt = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
    },
    "SECREAT KEY",
    { expiresIn: "1d" }
  );
};

const TraningPartner = mongoose.model("TraningPartner", traningPartnerSchema);
export default TraningPartner;
