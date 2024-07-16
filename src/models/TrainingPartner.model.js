import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Sequence from "./sequence.model.js";
const Schema = mongoose.Schema;

const trainingPartnerSchema = new Schema(
  {
    password: { type: String, required: true },
    organizationName: { type: String, required: true },
    organizationCategory: { type: String, required: true },
    courses: [
      {
        type: String,
      },
    ],
    applicationStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected"],
    },
    applicationViewed: {
      type: Boolean,
      default: false,
    },
    editPermission: {
      type: Boolean,
      default: false,
    },
    noOfEditRequest: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      default: "TrainingPartner",
      enum: ["TrainingPartner"],
    },
    sector: [
      {
        type: String,
        required: [true, "sector name is required"],
      },
    ],

    businessesType: {
      type: String,
      required: [true, "type of training is required"],
    },

    certificates: [
      {
        type: String,
      },
    ],

    pre_payment_invoices: [
      {
        type: String,
      },
    ],
    post_payment_invoices: [
      {
        type: String,
      },
    ],

    centerId: { type: String, required: true },
    tpCode: { type: String },
    scheme: { type: String, required: true },
    affiliation: { type: String },
    dateOfIncorporation: { type: Date },
    registeredOfficeAddress: { type: String },
    registeredOfficeDist: { type: String },
    registeredOfficeCity: { type: String },
    registeredOfficeState: { type: String },
    registeredOfficePin: { type: String },
    registeredOfficeTelephone: { type: String },
    registeredOfficeMobile: { type: String },
    registeredOfficeFax: { type: String },
    registeredOfficeEmail: { type: String, required: true },
    registeredOfficeGst: { type: String },
    regionalStateOfficeAddress: { type: String },
    regionalStateOfficeDist: { type: String },
    regionalStateOfficeCity: { type: String },
    regionalStateOfficeState: { type: String },
    regionalStateOfficePin: { type: String },
    regionalStateOfficeTelephone: { type: String },
    regionalStateOfficeMobile: { type: String },
    regionalStateOfficeFax: { type: String },
    regionalStateOfficeEmail: { type: String },
    regionalStateOfficeGst: { type: String },
    website: { type: String },
    pan: { type: String },
    prnNo: { type: String },
    headOwnerName: { type: String },
    headOwnerDob: { type: Date },
    headOwnerCity: { type: String },
    headOwnerResAddress: { type: String },
    headOwnerPermanentAddress: { type: String },
    headOwnerMobile: { type: String },
    headOwnerAltMobile: { type: String },
    headOwnerEmail: { type: String },
    headOwnerQualification: { type: String },
    headOwnerWorkExperience: { type: String },
    headOwnerPanNo: { type: String },
    headOwnerAadharNo: { type: String },
    headOwnerPromoter1: { type: String },
    headOwnerPromoter2: { type: String },
    headOwnerPromoter3: { type: String },
    projectContactPersonName: { type: String },
    projectContactPersonDesignation: { type: String },
    projectContactPersonCity: { type: String },
    projectContactPersonMobile: { type: String },
    projectContactPersonAltMobile: { type: String },
    projectContactPersonResAddress: { type: String },
    projectContactPersonPermanentAddress: { type: String },
    projectContactPersonEmail: { type: String },
    projectContactPersonAltEmail: { type: String },
    paymentStatus: { type: String },
    status: { type: String },
  },
  {
    timestamps: true,
  }
);

// ** hasing the password before saving the document
trainingPartnerSchema.pre("save", function (next) {
  const trainingPartner = this;
  const SALT = bcrypt.genSaltSync(10);
  const encryptedPassword = bcrypt.hashSync(trainingPartner.password, SALT);
  trainingPartner.password = encryptedPassword;
  next();
});

trainingPartnerSchema.pre("save", async function (next) {
  const tp = this;
  if (tp.isNew) {
    try {
      const sequence = await Sequence.findByIdAndUpdate(
        "s1",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      tp.tpCode = `TP${sequence.seq}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// ** compare password function for login
trainingPartnerSchema.methods.checkPassword = function check(
  userInputPlainPassword
) {
  return bcrypt.compareSync(userInputPlainPassword, this.password);
};

// ** generate jwt token for middleware verification
trainingPartnerSchema.methods.generateJwt = function generate() {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    "this is a secrete a key",
    { expiresIn: "30d" }
  );
};

const TrainingPartner = mongoose.model(
  "TrainingPartner",
  trainingPartnerSchema
);
export default TrainingPartner;
