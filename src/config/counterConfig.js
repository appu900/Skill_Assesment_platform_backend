import Sequence from "../models/sequence.model.js";

async function initializeSequence() {
  try {
    const sequence = await Sequence.findById("s1")
    console.log(sequence);
    if (!sequence) {
      const res = await Sequence.create({ _id: "s1", seq: 0 });
      console.log(res);
    }
  } catch (error) {
    throw error;
  }
}

export default initializeSequence;


