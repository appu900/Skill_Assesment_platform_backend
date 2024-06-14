import BatchRepository from "../repository/Batch-repository.js";
import StudentService from "./student-service.js";
import StudentRepository from "../repository/student-repository.js";
import TrainerRepository from "../repository/Trainer-Repository.js";

class BatchService {
  constructor() {
    this.batchRepository = new BatchRepository();
    this.studentRepository = new StudentRepository();
    this.trainerRepository = new TrainerRepository();
  }

  async createBatch(data) {
    try {
      const batch = await this.batchRepository.create(data);
      return batch;
    } catch (error) {
      throw error;
    }
  }

  async addStudent(batchId, data) {
    try {
      const batch = await this.batchRepository.get(batchId);
      console.log(batch);
      if (!batch) {
        throw new Error("batch not found");
      }
      data.enrolledBatch = batch._id;
      const student = await this.studentRepository.create(data);
      batch.students.push(student);
      await batch.save();
      console.log("this is batch", batch);
      return student;
    } catch (error) {
      throw error;
    }
  }

  async addTrainerTobatch(batchId, data) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("batch not found");
      }
      const trainer = await this.trainerRepository.create(data);
      trainer.batches.push(batch);
      batch.trainers.push(trainer);
      await batch.save();
      await trainer.save();
      return trainer;
    } catch (error) {
      throw error;
    }
  }

  async getBatchData(batchId) {
    try {
      const res = await this.batchRepository.getBatchDetails(batchId);
      return res;
    } catch (error) {
      throw error;
    }
  }

 
  async getBatchesOfTrainingPartner(id){
    try {
      const res = await this.batchRepository.getAllbatchesForAnIndividualTrainingPartner(id);
      return res
    } catch (error) {
      throw error;
    }
  }
}

export default BatchService;
