import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      default: "not-started",
      enum: ["not-started", "completed"],
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    testAgency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssesmentAgency",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = new mongoose.model("Exam", examSchema);
export default Exam;
