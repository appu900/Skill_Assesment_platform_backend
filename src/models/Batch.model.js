/**
 *
 * batchName
 * startingdate
 * ending date
 * assement partner
 * examdate
 * trainingpartner
 * students[]
 * teachers[]
 *
 *
 *
 *
 */

import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "batch name can not be null"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingPartner",
    },
    startDate: {
      type: Date,
      required: [true, "Training start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Training start date is required"],
    },
    examDate: {
      type: Date,
    },
    status: {
      type: String,
      default: "onGoing",
      enum:["Completed","onGoing"]
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    trainers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trainer",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
