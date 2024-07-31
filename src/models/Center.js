import mongoose from "mongoose";

const centerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  PRN_NO: {
    type: String,
    required: true,
  },
  scheme: {
    type: String,
    required: true,
  },
  sanction_order_letter: {
    type: String,
    required: true,
  },
  centerId: {
    type: String,
    required: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  sector: {
    type: String,
    required: true,
  },

  approvedStatus: {
    type: Boolean,
    default: false,
  },

  courseCode: {
    type: String,
    required: true,
  },
  trainingOrganizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainingOrganization",
  },
});

const Center = mongoose.model("Center", centerSchema);
export default Center;
