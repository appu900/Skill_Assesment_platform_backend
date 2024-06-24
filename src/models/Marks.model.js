import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
  },
  mark: {
    type: Number,
    required: [true, "Marks are required"],
  },
  grade: {
    type: String,
    required: [true, "Grade is required"],
  },
});

const Mark = mongoose.model("Mark", markSchema);
export default Mark;







