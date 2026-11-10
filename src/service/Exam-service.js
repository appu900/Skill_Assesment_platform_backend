import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";
import AssessorRepository from "../repository/Assessor-Repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import ExamRepository from "../repository/Exam-repository.js";
import MarkRepository from "../repository/Mark-repository.js";
import { certificateQueue, JOB_NAMES } from "../queues/index.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { assertOwnerOrAdmin, isSameId } from "../utils/ownership.js";

class ExamService {
  constructor() {
    this.examRepository = new ExamRepository();
    this.batchRepository = new BatchRepository();
    this.assesmentAgencyRepository = new AssesmentAgencyRepository();
    this.assessorRepository = new AssessorRepository();
    this.markRepository = new MarkRepository();
  }

  async getExamOrFail(examId) {
    const exam = await this.examRepository.get(examId);
    if (!exam) {
      throw AppError.notFound("exam not found");
    }
    return exam;
  }

  // ** exam assigned to the logged in assesment agency (admin can access every exam)
  async getOwnedExam(examId, user) {
    const exam = await this.getExamOrFail(examId);
    assertOwnerOrAdmin(exam.assesmentAgencyId, user, "This exam is not assigned to you");
    return exam;
  }

  // ** admin assigns a paid batch to an approved assesment agency
  async createExam(courseName, batchId, assesmentAgencyId) {
    const batch = await this.batchRepository.get(batchId);
    if (!batch) {
      throw AppError.notFound("batch not found");
    }
    if (batch.isAssigned) {
      throw AppError.conflict("batch is already assigned to an exam");
    }
    if (!batch.batchActivePermission || !batch.paymentStatus) {
      throw new AppError("batch must be submitted and paid before an exam is assigned");
    }

    const assesmentAgency = await this.assesmentAgencyRepository.get(assesmentAgencyId);
    if (!assesmentAgency) {
      throw AppError.notFound("assesment agency not found");
    }
    if (assesmentAgency.applicationStatus !== "Approved") {
      throw new AppError("assesment agency is not approved");
    }

    const payload = {
      course: courseName || batch.courseName,
      sector: batch.sectorName,
      state: batch.state,
      scheme: batch.scheme,
      CenterName: batch.centerName,
      courseCode: batch.courseCode,
      CenterCode: batch.CenterCode,
      tpcode: batch.tpcode,
      batchId: batch._id,
      assesmentAgencyId: assesmentAgency._id,
      assesmentAgency: assesmentAgency.agencyName,
      // ** training partner always comes from the batch, never from the request
      TrainingOrganization: batch.trainingOrganization,
      TrainingPartnerId: batch.trainingOrganizationId,
      batchABN: batch.ABN_Number,
      batchPaymentAmount: batch.amountToPaid,
      totalStudents: batch.students.length,
      perStudentCost: batch.perStudentCost,
      courseCredit: batch.courseCredit,
      courseLevel: batch.courseLevel,
    };

    const response = await this.examRepository.create(payload);
    batch.isAssigned = true;
    await batch.save();
    return response;
  }

  async getALlExamDetails(pagination) {
    return this.examRepository.getAllExam(pagination);
  }

  async getExamsByAgencyId(testAgencyId) {
    return this.examRepository.findAllExamsByTestAgencyId(testAgencyId);
  }

  async assignAssesor(examId, assesorId, user) {
    const exam = await this.getOwnedExam(examId, user);
    const assessor = await this.assessorRepository.get(assesorId);
    if (!assessor) {
      throw AppError.notFound("assessor not found");
    }
    if (!isSameId(assessor.AssesmentAgency, exam.assesmentAgencyId)) {
      throw new AppError("assessor does not belong to the assesment agency of this exam");
    }

    await this.examRepository.addAssessorToExam(examId, assesorId);
    const batch = await this.batchRepository.get(exam.batchId);
    if (batch) {
      batch.assessorId = assessor._id;
      batch.assessorName = assessor.name;
      await batch.save();
    }
    return true;
  }

  async getAExamDetails(examId) {
    return this.examRepository.getAExam(examId);
  }

  async getAttendanceSheet(examId) {
    return this.examRepository.getAExam(examId);
  }

  async updateExamStatus(examId, attendanceSheetUrl, resultSheetUrl, user) {
    const exam = await this.getOwnedExam(examId, user);
    if (!attendanceSheetUrl || !resultSheetUrl) {
      throw new AppError("attendanceSheet and resultSheet are required");
    }
    exam.markUploadAndExamCompleteStatus = true;
    exam.status = "completed";
    exam.attendanceSheet = attendanceSheetUrl;
    exam.resultSheet = resultSheetUrl;
    exam.resultRejectionReason = null;
    await exam.save();
    return exam;
  }

  async uploadMultiplePhotos(examId, imagePayload, user) {
    const exam = await this.getOwnedExam(examId, user);
    if (!imagePayload || imagePayload.length === 0) {
      throw new AppError("at least one photo is required");
    }
    exam.images = imagePayload;
    await exam.save();
    return exam.images;
  }

  async updatePaymentStatus(examId) {
    await this.getExamOrFail(examId);
    return this.examRepository.updatePaymentStatus(examId);
  }

  async updateAssesmentDate(examId, date, user) {
    await this.getOwnedExam(examId, user);
    if (!date) {
      throw new AppError("date is required");
    }
    return this.examRepository.updateExamDate(examId, date);
  }

  async updateCandidateAttendanceNumber(examId, attendanceNumber, user) {
    const exam = await this.getOwnedExam(examId, user);
    const present = Number(attendanceNumber);
    if (!Number.isInteger(present) || present < 0 || present > (exam.totalStudents || 0)) {
      throw new AppError(`attendance must be a number between 0 and ${exam.totalStudents || 0}`);
    }
    exam.presentStudents = present;
    exam.totalNoOfStudentAbsent = (exam.totalStudents || 0) - present;
    await exam.save();
    return true;
  }

  // ** results to review: LC/RC sees corporate batches only. "pending" = sheets uploaded, certificates not issued yet
  async getResultsForReview(user, status) {
    const query = {};
    if (user?.role === ROLES.LCRC) {
      query.batchId = { $in: await this.batchRepository.model.find({ schemeType: "Corporate" }).distinct("_id") };
    }
    if (status === "pending") {
      query.status = "completed";
      query.certificateIssued = false;
    }
    return this.examRepository.model
      .find(query)
      .sort({ updatedAt: -1 })
      .populate("batchId", "batchName ABN_Number schemeType scheme courseName centerName students")
      .lean();
  }

  // ** the admin decides every result; an LC/RC only those of corporate batches
  async getReviewableExam(examId, user) {
    const exam = await this.getExamOrFail(examId);
    if (user?.role === ROLES.LCRC) {
      const batch = await this.batchRepository.get(exam.batchId);
      if (batch?.schemeType !== "Corporate") {
        throw AppError.forbidden("LC/RC can only review results of corporate batches");
      }
    }
    return exam;
  }

  // ** approving a result generates the certificates
  async approveResult(examId, user) {
    const exam = await this.getReviewableExam(examId, user);
    if (exam.status !== "completed") {
      throw new AppError("the assessment agency has not uploaded the result yet");
    }
    return this.publishCeritificates(examId);
  }

  // ** sends the result back to the assessment agency, which uploads the sheets again
  async rejectResult(examId, reason, user) {
    const exam = await this.getReviewableExam(examId, user);
    if (exam.certificateIssued || ["queued", "processing"].includes(exam.certificateStatus)) {
      throw new AppError("certificates are already issued for this result");
    }
    if (exam.status !== "completed") {
      throw new AppError("there is no uploaded result to reject");
    }
    if (!reason || !String(reason).trim()) {
      throw new AppError("Please give a reason for the rejection");
    }
    exam.status = "not-started";
    exam.markUploadAndExamCompleteStatus = false;
    exam.resultRejectionReason = String(reason).trim().slice(0, 500);
    await exam.save();
    return { examId: exam._id, rejected: true };
  }

  // ** validates the exam and queues certificate generation, the certificate worker does the rest
  async publishCeritificates(examId) {
    const exam = await this.getExamOrFail(examId);

    if (exam.certificateIssued) {
      throw AppError.conflict("Certificate for this exam Already published");
    }
    if (["queued", "processing"].includes(exam.certificateStatus)) {
      throw AppError.conflict("Certificates for this exam are already being generated");
    }
    const marksCount = await this.markRepository.countByExam(examId);
    if (marksCount === 0) {
      throw new AppError("marks are not uploaded for this exam");
    }

    // ** atomic guard: only one publish request can move the exam into "queued"
    const locked = await this.examRepository.model.findOneAndUpdate(
      {
        _id: examId,
        certificateIssued: false,
        certificateStatus: { $nin: ["queued", "processing"] },
      },
      { certificateStatus: "queued", certificateError: null },
      { new: true }
    );
    if (!locked) {
      throw AppError.conflict("Certificates for this exam are already being generated");
    }

    try {
      const job = await certificateQueue.add(JOB_NAMES.PUBLISH_EXAM_CERTIFICATES, {
        examId: String(examId),
      });
      return { jobId: job.id, status: "queued" };
    } catch (error) {
      await this.examRepository.update(examId, {
        certificateStatus: "failed",
        certificateError: "could not queue the job",
      });
      throw new AppError("Certificate queue is not available, please try again later", 503);
    }
  }
}

export default ExamService;
