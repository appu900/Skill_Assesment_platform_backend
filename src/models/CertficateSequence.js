import mongoose from "mongoose";

const certificateSequenceSchema = new mongoose.Schema({
  _id:{
    type:String,
  },
  counter: {
    type: Number,
  },
});

const CertificateCouter = mongoose.model(
  "CertificateCounter",
  certificateSequenceSchema
);

export default CertificateCouter;
