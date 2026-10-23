import TrainerRepository from "../repository/Trainer-Repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import AppError from "../utils/AppError.js";
import { omit } from "../utils/fieldFilter.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";

class TrainerService {
  constructor() {
    this.trainerRepository = new TrainerRepository();
    this.batchRepository = new BatchRepository();
  }

  async getTrainerOrFail(trainerId) {
    const trainer = await this.trainerRepository.get(trainerId);
    if (!trainer) {
      throw AppError.notFound("Trainer not Found");
    }
    return trainer;
  }

  async createTrainer(data, trainingPartnerId) {
    return this.trainerRepository.createTrainner({
      ...omit(data, ["_id", "batches", "resultSheet", "trainingPartner"]),
      trainingPartner: trainingPartnerId,
    });
  }

  async getAllTrainer(pagination) {
    return this.trainerRepository.getAll(pagination);
  }

  async getTrainerById(trainerId) {
    return this.trainerRepository.get(trainerId);
  }

  // ** removes the trainer and its references from every batch
  async deleteTrainer(id, user) {
    const trainer = await this.getTrainerOrFail(id);
    assertOwnerOrAdmin(trainer.trainingPartner, user, "This trainer does not belong to you");
    await this.batchRepository.model.updateMany({ trainers: trainer._id }, { $pull: { trainers: trainer._id } });
    return this.trainerRepository.destroy(id);
  }

  async getAllTrainerBelongsToTrainingPartner(trainingPartnerId) {
    return this.trainerRepository.fetchTrainersOfTrainingPartner(trainingPartnerId);
  }

  async uploadTResultSheet(trainerId, resultSheetUrl, user) {
    const trainer = await this.getTrainerOrFail(trainerId);
    assertOwnerOrAdmin(trainer.trainingPartner, user, "This trainer does not belong to you");
    if (!resultSheetUrl) {
      throw new AppError("resultSheet file is required");
    }
    trainer.resultSheet = resultSheetUrl;
    await trainer.save();
    return true;
  }
}

export default TrainerService;
