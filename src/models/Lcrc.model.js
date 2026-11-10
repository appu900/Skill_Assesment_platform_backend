import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import serverConfig from "../config/serverConfig.js";
import hidePassword from "./plugins/hidePassword.js";

// ** LC/RC account, created by the admin; approves everything corporate
const LcrcSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: "LCRC",
      enum: ["LCRC"],
    },
  },
  {
    timestamps: true,
  }
);

LcrcSchema.plugin(hidePassword);

// ** hashing password only when it is set or changed
LcrcSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }
  next();
});

LcrcSchema.methods.checkPassword = function check(userInputPlainPassword) {
  return bcrypt.compareSync(String(userInputPlainPassword), this.password);
};

LcrcSchema.methods.generateJwt = function generate() {
  return jwt.sign({ id: this._id, role: "LCRC", name: this.name }, serverConfig.JWT_SECRET, {
    expiresIn: serverConfig.JWT_EXPIRES_IN,
  });
};

const Lcrc = mongoose.model("Lcrc", LcrcSchema);

export default Lcrc;
