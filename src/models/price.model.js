import mongoose from "mongoose";

const priceSchema = new mongoose.Schema({
  scheme: {
    type: String,
    required: true,
  },
  amountPerStudent: {
    type: Number,
    required: true,
  },
});

const Price = new mongoose.model("Price", priceSchema);
export default Price;
