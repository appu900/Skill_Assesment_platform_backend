import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  seq: {
    type: Number,
  },
});

const Sequence = mongoose.model("Sequence", sequenceSchema);

export default Sequence;
