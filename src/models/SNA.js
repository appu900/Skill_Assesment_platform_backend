import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import serverConfig from "../config/serverConfig.js";
import hidePassword from "./plugins/hidePassword.js";

const SNASchema = new mongoose.Schema(
  {
    scheme: {
      type: String,
      required: true,
    },
    schemetype: {
      type: String,
      required: true,
      enum: ["State Government", "Central Government"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "SNA",
      enum: ["SNA"],
    },
  },
  {
    timestamps: true,
  }
);

SNASchema.plugin(hidePassword);

// ** hashing password only when it is set or changed
SNASchema.pre("save", function (next) {
  if (this.isModified("password")) {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }
  next();
});

// ** password comparasion for login
SNASchema.methods.checkPassword = function check(userInputPlainPassword) {
  return bcrypt.compareSync(String(userInputPlainPassword), this.password);
};

// ** generate jwt token, scheme and state are used to scope what this SNA may approve
SNASchema.methods.generateJwt = function generate() {
  return jwt.sign(
    {
      id: this._id,
      role: "SNA",
      scheme: this.scheme,
      state: this.state,
    },
    serverConfig.JWT_SECRET,
    { expiresIn: serverConfig.JWT_EXPIRES_IN }
  );
};

const SNA = mongoose.model("SNA", SNASchema);

export default SNA;
