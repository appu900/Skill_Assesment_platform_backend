import Sequence from "../models/sequence.model.js";

async function initializeSequence() {
  const sequence = await Sequence.findById("s1");
  if (!sequence) {
    await Sequence.create({ _id: "s1", seq: 0 });
  }
}

export default initializeSequence;
