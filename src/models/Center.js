import mongoose from "mongoose";

const centerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  state  : {
    type: String,
    required: true,
  },
  PRN_NO: {
    type: String,
    required: true,
  },
  
  schemes: [
    {
      schemeName:{
        type: String,
        required: true,
      },
      approveStatus: {
        type: Boolean,
        default: false,
      },
    },
  ],

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
  
  sectors:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sector",
    }
  ],

  trainingOrganizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TrainingPartner",
  },
});

const Center = mongoose.model("Center", centerSchema);
export default Center;


