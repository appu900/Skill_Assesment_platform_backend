import StudentCounter from "../models/StudentCounter.js";

async function initializeStudentCounter() {
  try {
    const sequence = await StudentCounter.findById("s1")
    if (!sequence) {
      const res = await StudentCounter.create({ _id: "s1", counter: 0 });
    }
  } catch (error) {
    throw error;
  }
}

export default initializeStudentCounter;






