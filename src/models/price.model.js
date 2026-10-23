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

const Price = mongoose.model("Price", priceSchema);
export default Price;
