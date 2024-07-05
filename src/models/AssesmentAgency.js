import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const assesmentAgencySchema = new mongoose.Schema(
  {
    agencyName: {
      type: String,
      required: [true, "name is missing here"],
    },
    officeAddress: {
      type: String,
      required: [true, "Address is missing"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    applicationStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected"],
    },
    communicationAddress: {
      type: String,
      required: [true, "communication address is required"],
    },
    sectors: [
      {
        type: String,
        required: [true, "sector is required"],
      },
    ],
    courses: [
      {
        type: String,
        required: [true, "courses is required"],
      },
    ],
    phoneNumber: {
      type: String,
      required: [true, "phone number is missing"],
    },
    availability: {
      type: Boolean,
      default: true,
      enum: [true, false],
    },
    role: {
      type: String,
      default: "AssesmentAgency",
    },
    email: {
      type: String,
      unique: true,
      required: [true, "email is missing"],
    },
    websiteLink: {
      type: String,
      required: [true, "this field is required"],
    },
    headOfTheOrganization: {
      type: String,
      required: [true, "this is mandatory"],
    },
    SPOC_NAME: {
      type: String,
      required: [true, "this fileld is required"],
    },
    SPOC_EMAIL: {
      type: String,
      required: [true, "this fileld is required"],
    },
    SPOC_CONTACT_NO: {
      type: String,
      required: [true, "this fileld is required"],
    },
    legalStatusOfTheOrganization: {
      type: String,
    },
    COMPANY_PAN_NO: {
      type: String,
      required: [true, "pan no of the company is required"],
    },
    COMPANY_GST_NO: {
      type: String,
      required: [true, "GST no of the company is required"],
    },
    NO_OF_BRANCHES: {
      type: String,
      required: [true, "GST no of the company is required"],
    },
    BRANCH_ADDRESS: {
      type: String,
      required: [true, "this filed is required"],
    },
    geographical_region: {
      type: String,
    },
    state_Under_geographicalRegion: {
      type: String,
    },
    total_no_of_certified_Assessor: {
      type: String,
    },
    LETTER_OF_NCVET: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

assesmentAgencySchema.pre("save", function (next) {
  const assesmentAgency = this;
  const SALT = bcrypt.genSaltSync(10);
  const encryptedPassword = bcrypt.hashSync(assesmentAgency.password, SALT);
  assesmentAgency.password = encryptedPassword;
  next();
});

// ** function for checkPassword ***
assesmentAgencySchema.methods.checkPassword = function check(
  userInputPlainPassword
) {
  return bcrypt.compareSync(userInputPlainPassword, this.password);
};

// *** function for generate token
assesmentAgencySchema.methods.generateJwt = function generate() {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      name:this.agencyName
    },
    "this is a secrete a key",
    { expiresIn: "1d" }
  );
}; 

const AssesmentAgency = mongoose.model(
  "AssesmentAgency",
  assesmentAgencySchema
);

export default AssesmentAgency;







