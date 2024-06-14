import Batch from "../models/Batch.model.js";
import CrudRepository from "./crud.repository.js";

class BatchRepository extends CrudRepository {
  constructor() {
    super(Batch);
  }

  async getBatchDetails(batchId) {
    try {
      const batch = await Batch.findById(batchId)
        .populate("students")
        .populate("trainers")
        .populate("createdBy");
      return batch;
    } catch (error) {
      throw error;
    }
  }

  async getAllbatchesForAnIndividualTrainingPartner(id) {
    try {
      const response = await Batch.find({
        createdBy: id,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * first create batch
   * then as a updating state -> create students
   * add store the ids of the student in student array
   *
   */
}

export default BatchRepository;
