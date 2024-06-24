import Mark from "../models/Marks.model.js";
import CrudRepository from "./crud.repository.js";

class MarkRepository extends CrudRepository {
  constructor() {
    super(Mark);
  }

  async getBatchMarks(batchId) {
    try {
      const res = await Mark.find({ batchId }).populate("student");
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getStudentMarks(student) {
    try {
      const res = await Mark.find({ student }).populate("student");
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default MarkRepository;
 