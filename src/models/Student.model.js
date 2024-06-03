import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Student name is required"],
  },

  email: {
    type: String,
    required: [true, "Student email is required"],
    unique: [true, "student email should be unique"],
  },

  phone: {
    type: String,
    unique: [true, "student phone should be unique"],
  },
  password: {
    type: String,
    required: [true, "Student password is required"],
  },
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
