import StudentCounter from "../models/StudentCounter.js";

async function initializeStudentCounter() {
  const counter = await StudentCounter.findById("s1");
  if (!counter) {
    await StudentCounter.create({ _id: "s1", counter: 0 });
  }
}

export default initializeStudentCounter;
