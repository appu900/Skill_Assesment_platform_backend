import mongoose from "mongoose";

const schemeSchema = new mongoose.Schema({
  schemeType: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  projectType: {
    type: String,
    required: true,
  },
  pricePerStudent: {
    type: Number,
    required: true,
  },
});

const Scheme = new mongoose.model("Scheme", schemeSchema);
export default Scheme;
