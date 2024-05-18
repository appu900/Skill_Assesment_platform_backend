import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "email already exists"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
});

// ** hash the password before saving the admin document to db
adminSchema.pre("save", function (next) {
  const admin = this;
  const SALT = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(admin.password, SALT);
  admin.password = hashedPassword;
  next();
});


adminSchema.methods.comparePassword = function compare(inputPassword){
  return bcrypt.compareSync(inputPassword,this.password)
}


adminSchema.methods.generateJwt = function generate() {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
    },
    "this is a secrete a key",
    { expiresIn: "1d" }
  );
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
