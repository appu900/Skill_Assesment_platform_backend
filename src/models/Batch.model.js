import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Batch name is required"],
  },
  scheme: {
    type: String,
    required: [true, "Batch scheme is required"],
  },
  startDate: {
    type: Date,
    required: [true, "Batch start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "Batch end date is required"],
  },
  trainingPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainingPartner",
  },
  
});

module.exports = mongoose.model("Batch", batchSchema);
