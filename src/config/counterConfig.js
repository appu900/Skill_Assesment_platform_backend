import Sequence from "../models/sequence.model.js";

async function initializeSequence() {
  try {
    const sequence = await Sequence.findById("s1")
    if (!sequence) {
      const res = await Sequence.create({ _id: "s1", seq: 0 });
    }
  } catch (error) {
    throw error;
  }
}

export default initializeSequence;






