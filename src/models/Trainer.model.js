import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Teacher name is required"],
  },
  email: {
    type: String,
    required: [true, "Teacher Teacher is required"],
    unique: [true, "Teacher email is already exists"],
  },
  password: {
    type: String,
    required: [true, "Teacher password is required"],
  },

  batch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
});
module.exports = mongoose.model("Teacher", teacherSchema);
