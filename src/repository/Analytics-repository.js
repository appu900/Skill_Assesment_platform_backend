import Batch from "../models/Batch.model.js";
import Student from "../models/Student.model.js";
import TrainingPartner from "../models/TrainingPartner.model.js";
import AssesmentAgency from "../models/AssesmentAgency.js";
import Center from "../models/Center.js";
import Mark from "../models/Marks.model.js";
import Exam from "../models/Exam.model.js";
import Assessor from "../models/Assessor.js";
import Certificate from "../models/Certificate.js";
import AssesmentAgencyInvoice from "../models/AssesmentAgencyMonthlyinvoice.js";
import Trainer from "../models/Trainer.model.js";
import Scheme from "../models/Scheme.js";

// ** dashboards read everything through aggregation pipelines; joins use $lookup on the real collection names
const TIMEZONE = "Asia/Kolkata";
const monthOf = (field) => ({ $dateToString: { format: "%Y-%m", date: field, timezone: TIMEZONE } });
const candidates = { $size: { $ifNull: ["$students", []] } };

// ** one readable stage per batch, the same rules as the frontend (lib/domain/stages.ts)
const BATCH_STAGE = {
  $switch: {
    branches: [
      { case: "$certificateIssued", then: "Completed" },
      { case: "$isAssigned", then: "In assessment" },
      { case: "$paymentStatus", then: "Awaiting assessment" },
      { case: { $not: ["$batchActivePermission"] }, then: { $cond: ["$rejectedByGovernmentBody", "Returned for changes", "Draft"] } },
      // ** government batches are approved by the SNA, corporate ones by the LC/RC
      { case: { $not: ["$approvedByGovernmentBody"] }, then: "Awaiting approval" },
      { case: { $not: ["$clientPaymentStatus"] }, then: "Payment due" },
    ],
    default: "Payment under review",
  },
};

const EXAM_STAGE = {
  $switch: {
    branches: [
      { case: "$certificateIssued", then: "Certified" },
      { case: "$markUploadAndExamCompleteStatus", then: "Results submitted" },
      { case: { $not: ["$AssessorId"] }, then: "Assign assessor" },
      { case: { $not: ["$assesmentdate"] }, then: "Schedule date" },
    ],
    default: "Assessment pending",
  },
};

const countBy = (field) => [{ $group: { _id: field, count: { $sum: 1 } } }, { $project: { _id: 0, key: "$_id", count: 1 } }, { $sort: { count: -1 } }];

class AnalyticsRepository {
  // ---------------------------------------------------------------- batches

  async batchSummary(match) {
    const [result] = await Batch.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                batches: { $sum: 1 },
                candidates: { $sum: candidates },
                revenue: { $sum: { $cond: ["$paymentStatus", "$amountToPaid", 0] } },
              },
            },
          ],
          stages: [{ $addFields: { stage: BATCH_STAGE } }, ...countBy("$stage")],
          schemes: [
            { $group: { _id: "$scheme", batches: { $sum: 1 }, candidates: { $sum: candidates } } },
            { $project: { _id: 0, name: "$_id", batches: 1, candidates: 1 } },
            { $sort: { candidates: -1 } },
          ],
          courses: [
            { $group: { _id: "$courseName", batches: { $sum: 1 }, candidates: { $sum: candidates } } },
            { $project: { _id: 0, name: "$_id", batches: 1, candidates: 1 } },
            { $sort: { candidates: -1 } },
            { $limit: 8 },
          ],
          states: [
            { $group: { _id: "$state", candidates: { $sum: candidates } } },
            { $project: { _id: 0, name: "$_id", candidates: 1 } },
            { $sort: { candidates: -1 } },
            { $limit: 8 },
          ],
          monthly: [
            { $group: { _id: monthOf("$createdAt"), batches: { $sum: 1 }, candidates: { $sum: candidates } } },
            { $project: { _id: 0, month: "$_id", batches: 1, candidates: 1 } },
          ],
        },
      },
    ]);
    return result;
  }

  // ** batches joined with their training partner: who trains how many candidates
  async topTrainingPartners(match, limit = 6) {
    return Batch.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$trainingOrganizationId",
          batches: { $sum: 1 },
          candidates: { $sum: candidates },
          completed: { $sum: { $cond: ["$certificateIssued", 1, 0] } },
        },
      },
      { $lookup: { from: TrainingPartner.collection.name, localField: "_id", foreignField: "_id", as: "partner" } },
      { $unwind: "$partner" },
      { $project: { _id: 0, name: "$partner.organizationName", batches: 1, candidates: 1, completed: 1 } },
      { $sort: { candidates: -1 } },
      { $limit: limit },
    ]);
  }

  // ** batches joined with their centre
  async candidatesPerCentre(match, limit = 8) {
    return Batch.aggregate([
      { $match: match },
      { $group: { _id: "$centerId", batches: { $sum: 1 }, candidates: { $sum: candidates } } },
      { $lookup: { from: Center.collection.name, localField: "_id", foreignField: "_id", as: "centre" } },
      { $unwind: "$centre" },
      { $project: { _id: 0, name: "$centre.name", batches: 1, candidates: 1 } },
      { $sort: { candidates: -1 } },
      { $limit: limit },
    ]);
  }

  // ---------------------------------------------------------------- candidates

  // ** candidates joined with their batch so they can be filtered by the batch's partner / scheme / state
  async candidateSummary(batchMatch = null, studentMatch = {}) {
    const pipeline = [{ $match: studentMatch }];
    if (batchMatch) {
      pipeline.push(
        { $lookup: { from: Batch.collection.name, localField: "enrolledBatch", foreignField: "_id", as: "batch" } },
        { $unwind: "$batch" },
        { $match: Object.fromEntries(Object.entries(batchMatch).map(([key, value]) => [`batch.${key}`, value])) }
      );
    }
    pipeline.push({
      $facet: {
        gender: countBy({ $ifNull: ["$gender", "Not given"] }),
        category: countBy({ $ifNull: ["$category", "Not given"] }),
        monthly: [{ $group: { _id: monthOf("$createdAt"), enrolled: { $sum: 1 } } }, { $project: { _id: 0, month: "$_id", enrolled: 1 } }],
        absent: [{ $match: { absent: true } }, { $count: "count" }],
      },
    });
    const [result] = await Student.aggregate(pipeline);
    return result;
  }

  // ---------------------------------------------------------------- results

  // ** marks joined with their batch (partner / scheme / state filters) or exam (agency filter)
  async resultSummary({ batchMatch, examMatch } = {}) {
    const pipeline = [];
    if (batchMatch) {
      pipeline.push(
        { $lookup: { from: Batch.collection.name, localField: "batchId", foreignField: "_id", as: "batch" } },
        { $unwind: "$batch" },
        { $match: Object.fromEntries(Object.entries(batchMatch).map(([key, value]) => [`batch.${key}`, value])) }
      );
    }
    if (examMatch) {
      pipeline.push(
        { $lookup: { from: Exam.collection.name, localField: "examId", foreignField: "_id", as: "exam" } },
        { $unwind: "$exam" },
        { $match: Object.fromEntries(Object.entries(examMatch).map(([key, value]) => [`exam.${key}`, value])) }
      );
    }
    pipeline.push({
      $facet: {
        results: countBy("$Result"),
        grades: [{ $group: { _id: "$Grade", count: { $sum: 1 } } }, { $project: { _id: 0, key: "$_id", count: 1 } }, { $sort: { key: 1 } }],
        courses: [
          {
            $group: {
              _id: "$courseName",
              passed: { $sum: { $cond: [{ $eq: ["$Result", "Pass"] }, 1, 0] } },
              failed: { $sum: { $cond: [{ $eq: ["$Result", "Fail"] }, 1, 0] } },
            },
          },
          { $project: { _id: 0, name: "$_id", passed: 1, failed: 1 } },
          { $sort: { passed: -1 } },
          { $limit: 8 },
        ],
      },
    });
    const [result] = await Mark.aggregate(pipeline);
    return result;
  }

  // ** certificates joined with their exam (certificate.batchId is a string, examId is a real reference)
  async certificateSummary(examMatch = null) {
    const pipeline = [];
    if (examMatch) {
      pipeline.push(
        { $lookup: { from: Exam.collection.name, localField: "examId", foreignField: "_id", as: "exam" } },
        { $unwind: "$exam" },
        { $match: Object.fromEntries(Object.entries(examMatch).map(([key, value]) => [`exam.${key}`, value])) }
      );
    }
    pipeline.push({
      $facet: {
        total: [{ $count: "count" }],
        monthly: [
          // ** DateOfIssue is stored as a string (older records in free formats), fall back to createdAt when it does not parse
          {
            $group: {
              _id: monthOf({ $convert: { input: "$DateOfIssue", to: "date", onError: "$createdAt", onNull: "$createdAt" } }),
              certificates: { $sum: 1 },
            },
          },
          { $project: { _id: 0, month: "$_id", certificates: 1 } },
        ],
      },
    });
    const [result] = await Certificate.aggregate(pipeline);
    return result;
  }

  // ---------------------------------------------------------------- applications, centres, exams, money

  async applicationStatus(Model) {
    return Model.aggregate(countBy("$applicationStatus"));
  }

  async partnerApplications() {
    return this.applicationStatus(TrainingPartner);
  }

  async agencyApplications() {
    return this.applicationStatus(AssesmentAgency);
  }

  // ** approval state of one scheme across the centres of a state (or of a training partner)
  async centreSchemeStatus(match, schemeName = null) {
    return Center.aggregate([
      { $match: match },
      { $unwind: "$schemes" },
      ...(schemeName ? [{ $match: { "schemes.schemeName": Array.isArray(schemeName) ? { $in: schemeName } : schemeName } }] : []),
      {
        $project: {
          status: {
            $cond: ["$schemes.approveStatus", "Approved", { $cond: [{ $eq: ["$schemes.rejectStatus", true] }, "Rejected", "Pending"] }],
          },
        },
      },
      ...countBy("$status"),
    ]);
  }

  async examSummary(match) {
    const [result] = await Exam.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                exams: { $sum: 1 },
                candidates: { $sum: { $ifNull: ["$totalStudents", 0] } },
                present: { $sum: { $ifNull: ["$presentStudents", 0] } },
                certificates: { $sum: { $ifNull: ["$certificatesIssuedCount", 0] } },
              },
            },
          ],
          stages: [{ $addFields: { stage: EXAM_STAGE } }, ...countBy("$stage")],
          monthly: [
            { $group: { _id: monthOf("$createdAt"), exams: { $sum: 1 }, assessed: { $sum: { $ifNull: ["$presentStudents", 0] } } } },
            { $project: { _id: 0, month: "$_id", exams: 1, assessed: 1 } },
          ],
          // ** exams joined with their assessor
          assessors: [
            { $match: { AssessorId: { $ne: null } } },
            { $group: { _id: "$AssessorId", exams: { $sum: 1 }, candidates: { $sum: { $ifNull: ["$presentStudents", 0] } } } },
            { $lookup: { from: Assessor.collection.name, localField: "_id", foreignField: "_id", as: "assessor" } },
            { $unwind: "$assessor" },
            { $project: { _id: 0, name: "$assessor.name", exams: 1, candidates: 1 } },
            { $sort: { exams: -1 } },
            { $limit: 6 },
          ],
        },
      },
    ]);
    return result;
  }

  async invoiceSummary(agencyId) {
    const [result] = await AssesmentAgencyInvoice.aggregate([
      { $match: { AssesmentAgencyId: agencyId } },
      {
        $group: {
          _id: null,
          paid: { $sum: { $cond: ["$paymentStatus", { $ifNull: ["$paidAmount", "$totalAmountToBePaid"] }, 0] } },
          unpaid: { $sum: { $cond: ["$paymentStatus", 0, "$totalAmountToBePaid"] } },
        },
      },
    ]);
    return result ?? { paid: 0, unpaid: 0 };
  }

  async count(Model, match = {}) {
    return Model.countDocuments(match);
  }

  get models() {
    return { Center, Trainer, Assessor, Batch, Exam, Scheme };
  }
}

export default AnalyticsRepository;
