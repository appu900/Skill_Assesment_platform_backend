import mongoose from "mongoose";

const SectorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Sector name is required"],
  },
  description: {
    type: String,
  },
});

const Sector = mongoose.model("Sector", SectorSchema);
export default Sector;


