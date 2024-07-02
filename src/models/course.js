// ** filed to be in course model **
/**
 *  name
 *  coursecode
 *  sectorId
 *  description
 *  duration
 *  Nos[array{description,code}]
 *  ncrf level
 *  credit
 *  total credit
 *  theory mark
 * parctical marks
 * viva marks
 * total marks
 * nos wise pass %
 *
 */

import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, "course name is required"],
    },
    courseCode: {
      type: String,
      required: [true, "course code is required"],
    },
    sectorName: {
      type: String,
      required: [true, "sector name is required"],
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, "duration is required"],
    },
    Nos: [
      {
        description: {
          type: String,
          required: [true, "description is required"],
        },
        code: {
          type: String,
          required: [true, "code is required"],
        },
        credit: {
          type: Number,
          required: [true, "credit is required"],
        },
        theoryMarks: {
          type: Number,
        },
        practicalMarks: {
          type: Number,
        },
        vivaMarks: {
          type: Number,
        },
        totalMarks: {
          type: Number,
        },
        nosWisePassPercentage: {
          type: Number,
        },
      },
    ],

    ncrfLevel: {
      type: Number,
    },
    totalCredit: {
      type: Number,
    },

    aggregatePercentage: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
