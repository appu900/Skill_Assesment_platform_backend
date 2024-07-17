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
import Sequence from "./sequence.model.js";

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
    trainingOrganizationId: {
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
    isAssigned: {
      type: Boolean,
      default: false,
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
    },

    assessorName: {
      type: String,
    },
    assessorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessor",
    },
    prePaymentInvoice: {
      type: String,
    },
    postPaymentInvoice: {
      type: String,
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    batchActivePermission: {
      type: Boolean,
      default: false,
    },
    amountToPaid: {
      type: Number,
    },
  },

  {
    timestamps: true,
  }
);

batchSchema.pre("save", async function (next) {
  if (this.isNew) {
    const stateInitial = this.state ? this.state.charAt(0).toUpperCase() : "";
    const courseInitial = this.courseName
      ? this.courseName.charAt(0).toUpperCase()
      : "";
    const sectorInitial = this.sectorName
      ? this.sectorName.charAt(0).toUpperCase()
      : "";

    try {
      const sequence = await Sequence.findByIdAndUpdate(
        "s1",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.ABN_Number = `B${stateInitial}${courseInitial}${sectorInitial}${sequence.seq}`;
      next();
    } catch (error) {
      console.log(error.message);
      next(error);
    }
  } else {
    next();
  }
});

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
