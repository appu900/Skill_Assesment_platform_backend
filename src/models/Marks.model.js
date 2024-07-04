import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
});
   
const Marks = new mongoose.model("Marks", marksSchema);
export default Marks;

