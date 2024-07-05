import CrudRepository from "./crud.repository.js";
import Mark from "../models/Marks.model.js";

class MarkRepository extends CrudRepository {
  constructor() {
    super(Mark);
  }

  async getMarkByStudentId(studentId) {
    try {
      const response = await Mark.findOne({ studentId: studentId });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getStudentMarksByBatchId(batchId){
    try{
      const response = await Mark.find({batchId: batchId});
      return response;
    } catch(error){
      throw error;
    }
  }
}

export default MarkRepository;
