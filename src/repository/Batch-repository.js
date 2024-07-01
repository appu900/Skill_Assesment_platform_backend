import Batch from "../models/Batch.model.js";
import CrudRepository from "./crud.repository.js";

class BatchRepository extends CrudRepository {
  constructor() {
    super(Batch);
  }

  async getAllBatches() {
    try {
      const response = await Batch.find()
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getBatchDetails(batchId) {
    try {
      const batch = await Batch.findById(batchId)
        .populate("students")
        .populate("trainers")

      return batch;
    } catch (error) {
      throw error;
    }
  }

  async getAllbatchesForAnIndividualTrainingPartner(id) {
    try {
      const response = await Batch.find({
        trainingOrganizationId: id,
      })
        .populate("students")
        .populate("trainers");
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
