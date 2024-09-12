import mongoose from "mongoose";


const schemeSchema = new mongoose.Schema({
  schemeType: {
    type: String,
    required: true,
  },
  logo:{
    type:String,
    required:[true,"logo is required !"]
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
  },
  projectType: {
    type: String,
    required: true,
  },
  state:{
    type:String,
    required:true
  },
  pricePerStudent: {
    type: Number,
    default: 0,
  },
});

const Scheme = new mongoose.model("Scheme", schemeSchema);
export default Scheme;
