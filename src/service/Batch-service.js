import mongoose from "mongoose";
import BatchRepository from "../repository/Batch-repository.js";
import StudentRepository from "../repository/student-repository.js";
import TrainerRepository from "../repository/Trainer-Repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";
import CenterRepository from "../repository/Center-repository.js";
import InvoiceService from "./InvoiceService.js";
import SchemeRepository from "../repository/SchemeRepository.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { omit } from "../utils/fieldFilter.js";
import { assertOwnerOrAdmin, isSameId } from "../utils/ownership.js";

const GST_MULTIPLIER = 1.18;

// ** status / payment fields that are only changed by the workflow, never by the client payload
const PROTECTED_BATCH_FIELDS = [
  "_id",
  "ABN_Number",
  "tpcode",
  "trainingOrganization",
  "trainingOrganizationId",
  "approvedByGovernmentBody",
  "certificateIssued",
  "resultPublished",
  "isAssigned",
  "status",
  "students",
  "trainers",
  "assessorName",
  "assessorId",
  "prePaymentInvoice",
  "postPaymentInvoice",
  "clientPaymentStatus",
  "paymentStatus",
  "paymentPublishedBy",
  "transactionId",
  "batchActivePermission",
  "amountToPaid",
  "perStudentCost",
  "batchCompletedStatus",
  "createdAt",
  "updatedAt",
];

// ** fields of a student that are only set by marks / exam / certificate workflows
const PROTECTED_STUDENT_FIELDS = [
  "_id",
  "redg_No",
  "markUploadStatus",
  "marks",
  "absent",
  "certificate",
  "DateOfIssueMarksheet",
  "Grade",
  "enrolledBatch",
  "trainingPartner",
  "createdAt",
  "updatedAt",
];

class BatchService {
  constructor() {
    this.batchRepository = new BatchRepository();
    this.studentRepository = new StudentRepository();
    this.trainerRepository = new TrainerRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
    this.centerRepository = new CenterRepository();
    this.invoiceService = new InvoiceService();
    this.schemeRepository = new SchemeRepository();
  }

  async getBatchOrFail(batchId) {
    const batch = await this.batchRepository.get(batchId);
    if (!batch) {
      throw AppError.notFound("batch not found");
    }
    return batch;
  }

  // ** batch that the logged in training partner owns (admin can access every batch)
  async getOwnedBatch(batchId, user) {
    const batch = await this.getBatchOrFail(batchId);
    assertOwnerOrAdmin(batch.trainingOrganizationId, user, "This batch does not belong to you");
    return batch;
  }

  // ** names of the students of a batch that have no profile pic (one query instead of one per student)
  async checkImageForStudents(batch) {
    const students = await this.studentRepository.getStudentsByIds(batch.students);
    const studentsWithOutImage = students
      .filter((student) => !student.profilepic)
      .map((student) => student.name);
    return { flag: studentsWithOutImage.length === 0, studentsWithOutImage };
  }

  async createBatch(data, trainingPartnerId) {
    const trainingPartner = await this.trainingPartnerRepository.get(trainingPartnerId);
    if (!trainingPartner) {
      throw AppError.notFound("training partner not found");
    }
    if (trainingPartner.applicationStatus !== "Approved") {
      throw AppError.forbidden("training partner is not approved");
    }

    const payload = omit(data, PROTECTED_BATCH_FIELDS);

    if (payload.centerId) {
      const center = await this.centerRepository.get(payload.centerId);
      if (!center || !isSameId(center.trainingOrganizationId, trainingPartner._id)) {
        throw new AppError("center does not belong to this training partner");
      }
    }

    payload.trainingOrganization = trainingPartner.organizationName;
    payload.trainingOrganizationId = trainingPartner._id;
    // ** tp code is part of the ABN, take it from the training partner instead of the client
    payload.tpcode = trainingPartner.tpCode;

    return this.batchRepository.create(payload);
  }

  async addStudent(batchId, data, user) {
    const batch = await this.getOwnedBatch(batchId, user);
    if (batch.batchActivePermission) {
      throw new AppError("batch is already submitted, students cannot be added");
    }
    if (!data.MPR_Id) {
      throw new AppError("MPR Id is required");
    }
    const studentWithSameMprId = await this.studentRepository.getStudentWithMprId(data.MPR_Id);
    if (studentWithSameMprId) {
      throw AppError.conflict("Student with same MPR ID already exists");
    }

    const payload = omit(data, PROTECTED_STUDENT_FIELDS);
    payload.enrolledBatch = batch._id;
    payload.trainingPartner = batch.trainingOrganizationId;

    const student = await this.studentRepository.create(payload);
    batch.students.push(student._id);
    await batch.save();
    return student;
  }

  async addTrainerTobatch(batchId, data, user) {
    const batch = await this.getOwnedBatch(batchId, user);
    const trainer = await this.trainerRepository.create({
      ...omit(data, ["_id", "batches", "resultSheet"]),
      trainingPartner: batch.trainingOrganizationId,
    });
    trainer.batches.push(batch._id);
    batch.trainers.push(trainer._id);
    await batch.save();
    await trainer.save();
    return trainer;
  }

  async getBatchData(batchId) {
    return this.batchRepository.getBatchDetails(batchId);
  }

  async getBatchesOfTrainingPartner(id) {
    return this.batchRepository.getAllbatchesForAnIndividualTrainingPartner(id);
  }

  async getAllBatces(pagination) {
    return this.batchRepository.getAllBatches(pagination);
  }

  async filterQueryData(query) {
    const { state, sector, course, trainingOrganization } = query;
    const queryObject = {};
    if (state) {
      queryObject.state = String(state);
    }
    if (sector) {
      queryObject.sectorName = String(sector);
    }
    if (course) {
      queryObject.courseName = String(course);
    }
    if (trainingOrganization) {
      queryObject.trainingOrganization = String(trainingOrganization);
    }
    return this.batchRepository.filterData(queryObject);
  }

  // ** adds existing trainers (ids from the frontend) of the same training partner to the batch
  async bulkTeacherInsert(batchId, data, user) {
    const batch = await this.getOwnedBatch(batchId, user);
    if (!Array.isArray(data) || data.length === 0) {
      throw new AppError("trainerIds should be a non empty array");
    }
    if (!data.every((id) => mongoose.isValidObjectId(id))) {
      throw new AppError("trainerIds contains an invalid id");
    }

    const trainers = await this.trainerRepository.model.find({
      _id: { $in: data },
      trainingPartner: batch.trainingOrganizationId,
    });
    if (trainers.length !== new Set(data.map(String)).size) {
      throw new AppError("some trainers do not exist or belong to another training partner");
    }

    trainers.forEach((trainer) => batch.trainers.addToSet(trainer._id));
    return batch.save();
  }

  // ** final submission of the batch by the training partner, calculates the payable amount
  async activeBatch(batchId, user) {
    const batch = await this.getOwnedBatch(batchId, user);

    if (batch.batchActivePermission === true) {
      throw new AppError("batch is already Submitted");
    }
    if (batch.students.length === 0) {
      throw new AppError("complete the batch with students first");
    }
    if (batch.trainers.length === 0) {
      throw new AppError("Please add atleast One Trainer");
    }

    const { flag, studentsWithOutImage } = await this.checkImageForStudents(batch);
    if (flag === false) {
      throw new AppError(`students ${studentsWithOutImage.join(", ")} has no profile pic`);
    }

    let totalAmount = 0;
    let perStudentCost = 0;

    if (batch.schemeType === "Corporate") {
      const tp = await this.trainingPartnerRepository.get(batch.trainingOrganizationId);
      perStudentCost = tp?.organizationCorporatePaymentFee || 0;
      totalAmount = perStudentCost * batch.students.length * GST_MULTIPLIER;
    } else {
      const scheme = await this.schemeRepository.findBySchemeName(batch.scheme);
      if (!scheme) {
        throw AppError.notFound(`scheme ${batch.scheme} not found`);
      }
      perStudentCost = scheme.pricePerStudent;
      totalAmount = perStudentCost * batch.students.length;
    }

    await this.batchRepository.activateBatchByClient(batchId, totalAmount, perStudentCost);
    return true;
  }

  // ** admin sets the payable amount of a corporate batch manually
  async addPaymentCorporatePayment(batchId, amount) {
    const batch = await this.getBatchOrFail(batchId);
    if (batch.schemeType !== "Corporate") {
      throw new AppError("this batch is not corporate type");
    }
    if (batch.batchActivePermission === false) {
      throw new AppError("this batch is not ready to accept payment");
    }
    if (batch.paymentStatus) {
      throw new AppError("this batch is already paid");
    }
    const payableAmount = Number(amount);
    if (Number.isNaN(payableAmount) || payableAmount <= 0) {
      throw new AppError("amount must be a positive number");
    }

    batch.amountToPaid = payableAmount;
    const response = await batch.save();

    await this.invoiceService.upsertBatchInvoice(batch._id, {
      payer: "TrainingPartner",
      payee: "Admin",
      purpose: "batch payment",
      amount: payableAmount,
      paymentStatus: false,
      TrainingPartnerId: batch.trainingOrganizationId,
      BatchId: batch._id,
    });
    return response;
  }

  // ** tp uploads the pre and post payment invoice with the transaction id
  async updateClientPaymentDetails(
    batchId,
    preinVoiceUrl,
    postInvoiceUrl,
    transactionId,
    paymentPublishedBy,
    user
  ) {
    const batch = await this.getOwnedBatch(batchId, user);
    if (!batch.batchActivePermission) {
      throw new AppError("submit the batch before uploading payment details");
    }
    if (batch.paymentStatus) {
      throw new AppError("payment of this batch is already approved");
    }
    batch.clientPaymentStatus = true;
    batch.prePaymentInvoice = preinVoiceUrl;
    batch.postPaymentInvoice = postInvoiceUrl;
    batch.paymentPublishedBy = paymentPublishedBy;
    batch.transactionId = transactionId;
    return batch.save();
  }

  async getAllPaymentNotifications() {
    return this.batchRepository.getBatchesByPendingPayment();
  }

  async getBatchByCorporatePayment() {
    return this.batchRepository.getAllBatchByCorporatePayment();
  }

  // ** admin approves the payment of a batch
  async updateFinalPaymentStatus(batchId) {
    const batch = await this.getBatchOrFail(batchId);
    if (!batch.clientPaymentStatus) {
      throw new AppError("training partner has not uploaded the payment details yet");
    }
    if (batch.schemeType !== "Corporate" && !batch.approvedByGovernmentBody) {
      throw new AppError("government batch is not approved by the SNA yet");
    }

    await this.batchRepository.updatePayamentStatus(batchId);
    await this.invoiceService.upsertBatchInvoice(batch._id, {
      payer: "TrainingPartner",
      payee: "Admin",
      purpose: "batch payment",
      amount: batch.amountToPaid,
      paymentStatus: true,
      paymentDate: new Date(),
      transactionId: batch.transactionId,
      TrainingPartnerId: batch.trainingOrganizationId,
      BatchId: batch._id,
    });
    return true;
  }

  // ** all government batches that are approved by SNAs and wait for payment approval
  async getAllGovernmentBatchesForPaymentApproval() {
    return this.batchRepository.getAllGovernmentBatchesPendingPaymentData();
  }

  // ** an SNA only sees the batches of its own state and scheme
  async filterStateWiseAndScehemWiseData(query, user) {
    const queryObject = {};
    const state = user?.role === ROLES.SNA ? user.state : query.state;
    const scheme = user?.role === ROLES.SNA ? user.scheme : query.scheme;
    if (state) {
      queryObject.state = String(state);
    }
    if (scheme) {
      queryObject.scheme = String(scheme);
    }
    queryObject.batchActivePermission = true;
    queryObject.approvedByGovernmentBody = false;
    return this.batchRepository.filterData(queryObject);
  }

  // ** approval of a government batch by the SNA of the same state and scheme
  async approveGovernmentBatch(batchId, user) {
    const batch = await this.getBatchOrFail(batchId);
    if (user?.role === ROLES.SNA && (batch.scheme !== user.scheme || batch.state !== user.state)) {
      throw AppError.forbidden("This batch does not belong to your state or scheme");
    }
    if (batch.schemeType === "Corporate") {
      throw new AppError("corporate batches do not need SNA approval");
    }
    if (!batch.batchActivePermission) {
      throw new AppError("batch is not submitted yet");
    }
    batch.approvedByGovernmentBody = true;
    const response = await batch.save();
    return {
      batchId: response._id,
      sucess: true,
    };
  }

  async getAllBatchesBySchemeName(schemeName, state, user) {
    if (user?.role === ROLES.SNA) {
      return this.batchRepository.getBatchesBySchemeName(user.scheme, user.state);
    }
    return this.batchRepository.getBatchesBySchemeName(String(schemeName), String(state));
  }
}

export default BatchService;
