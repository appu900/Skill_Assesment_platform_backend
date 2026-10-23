import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import serverConfig from "../config/serverConfig.js";
import hidePassword from "./plugins/hidePassword.js";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "email already exists"],
    },
    role: {
      type: String,
      default: "Admin",
      enum: ["Admin"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.plugin(hidePassword);

// ** hash the password only when it is set or changed, re-hashing a hash locks the admin out
adminSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    const SALT = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, SALT);
  }
  next();
});

adminSchema.methods.comparePassword = function compare(inputPassword) {
  return bcrypt.compareSync(String(inputPassword), this.password);
};

adminSchema.methods.generateJwt = function generate() {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    serverConfig.JWT_SECRET,
    { expiresIn: serverConfig.JWT_EXPIRES_IN }
  );
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
