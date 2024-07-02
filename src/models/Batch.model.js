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
    courseName: {
      type: String,
      required: [true, "Course name is required"],
    },
    sectorName: {
      type: String,
      required: [true, "Sector name is required"],
    },
    trainingOrganization: {
      type: String,
      required: [true, "Training organization is required"],
    },
    trainingOrganizationId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingPartner",
    },
    scheme: {
      type: String,
      required: [true, "Scheme is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
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
      enum: ["Completed", "onGoing"],
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
    ABN_Number: {
      type: String,
      required: [true, "ABN number is required"],
    },
  },

  {
    timestamps: true,
  }
);

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;






