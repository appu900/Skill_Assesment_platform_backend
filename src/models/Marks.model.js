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
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  markParameters: [
    {
      parameterName: {
        type: String,
        required: true,
      },
      marks: {
        type: Number,
        required: true,
      },
      maxMarks: {
        type: Number,
        required: true,
      },
      grade: {
        type: String,
        required: true,
      },
    },
  ],
  totalMarks: {
    type: Number,
    required: true,
  },
});

const Marks = new mongoose.model("Marks", marksSchema);
export default Marks;




