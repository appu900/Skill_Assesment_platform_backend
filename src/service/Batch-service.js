import BatchRepository from "../repository/Batch-repository.js";
import StudentService from "./student-service.js";
import StudentRepository from "../repository/student-repository.js";
import TrainerRepository from "../repository/Trainer-Repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";
import mongoose from "mongoose";

class BatchService {
  constructor() {
    this.batchRepository = new BatchRepository();
    this.studentRepository = new StudentRepository();
    this.trainerRepository = new TrainerRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  async createBatch(data) {
    try {
      const trainingPartnerId = data.trainingOrganizationId;
      console.log(trainingPartnerId);
      const trainingPartner = await this.trainingPartnerRepository.get(
        trainingPartnerId
      );

      if (!trainingPartner) {
        throw new Error("training partner not found");
      }

      data.trainingOrganization = trainingPartner.organizationName;
      data.trainingOrganizationId = trainingPartner._id;

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

  async getBatchesOfTrainingPartner(id) {
    try {
      const res =
        await this.batchRepository.getAllbatchesForAnIndividualTrainingPartner(
          id
        );
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getAllBatces() {
    try {
      const response = await this.batchRepository.getAllBatches();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterQueryData(query) {
    try {
      const { state, sector, course, trainingOrganization } = query;
      const queryObject = {};
      if (state) {
        queryObject.state = state;
      }
      if (sector) {
        queryObject.sectorName = sector;
      }
      if (course) {
        queryObject.courseName = course;
      }
      if (trainingOrganization) {
        queryObject.trainingOrganization = trainingOrganization;
      }
      const response = await this.batchRepository.filterData(queryObject);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** this will update the teachers in the batch ( data will contains only existing teacher ids coming from frontend)

  async bulkTeacherInsert(batchId, data) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("batch not found with this id");
      }

      if (!Array.isArray(data)) {
        throw new Error("data should be in array format!");
      }
      const trainerIdObjects = data.map((id) => new mongoose.Types.ObjectId(id));
      batch.trainers.push(...trainerIdObjects);
      const response = await batch.save();
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default BatchService;
