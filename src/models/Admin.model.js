import mongoose from "mongoose";

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

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
