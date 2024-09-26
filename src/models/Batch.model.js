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
import getStateCode from "../utils/stateCodes.js";

const batchSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
    },
    tpcode: {
      type: String,
    },

    approvedByGovernmentBody: {
      type: Boolean,
      default: false,
    },

    certificateIssued: {
      type: Boolean,
      default: false,
    },

    centerName: {
      type: String,
      required: [true, "Center name is required"],
    },

    // markUploadAndExamCompleteStatus: {
    //   type: Boolean,
    //   default: false,
    // },

    perStudentCost: {
      type: Number,
    },

    resultPublished: {
      type: Boolean,
      default: false,
    },

    schemeType: {
      type: String,
      enum: ["Corporate", "State Government", "Central Government"],
      required: [true, "Scheme type is required"],
    },

    courseCode: {
      type: String,
      required: [true, "Course code is required"],
    },

    CenterCode: {
      type: String,
      required: [true, "Center code is required"],
    },

    courseDuration: {
      type: Number,
      required: true,
    },

    paymentPublishedBy:{
      type:String
    },

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
    transactionId: {
      type: String,
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
    clientPaymentStatus: {
      type: Boolean,
      default: false,
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
      default: 0,
    },

    batchCompletedStatus: {
      type: Boolean,
      default: false,
    },

    courseCredit: { type: String },
    courseLevel: { type: String },
    modeOfPayment: {
      type: String,
      enum: ["Online", "Offline"],
    },
  },

  {
    timestamps: true,
  }
);

batchSchema.pre("save", async function (next) {
  if (this.isNew) {
    const stateInitial = getStateCode(this.state);
    const courseInitial = this.courseCode
    const tpcode = this.tpcode;

    try {
      const sequence = await Sequence.findByIdAndUpdate(
        "s1",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.ABN_Number = `${stateInitial}${tpcode}${courseInitial}${sequence.seq}`;
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
