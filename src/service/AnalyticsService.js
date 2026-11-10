import mongoose from "mongoose";
import AnalyticsRepository from "../repository/Analytics-repository.js";
import AppError from "../utils/AppError.js";

const MONTHS = 12;

// ** the last 12 calendar months (IST), oldest first, as "2026-10"
function lastMonths(count = MONTHS) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

// ** merges monthly series from different pipelines into one zero-filled row per month
function monthlySeries(...series) {
  return lastMonths().map((month) => {
    const row = { month };
    for (const list of series) {
      const found = (list ?? []).find((item) => item.month === month) ?? {};
      for (const [key, value] of Object.entries(found)) {
        if (key !== "month") row[key] = value;
      }
    }
    return row;
  });
}

// ** fills every known key with 0 so charts always show the same categories
const ensureKeys = (rows = [], keys = []) => keys.map((key) => ({ key, count: rows.find((row) => row.key === key)?.count ?? 0 }));

const BATCH_STAGES = [
  "Draft",
  "Returned for changes",
  "Awaiting approval",
  "Payment due",
  "Payment under review",
  "Awaiting assessment",
  "In assessment",
  "Completed",
];
const EXAM_STAGES = ["Assign assessor", "Schedule date", "Assessment pending", "Results submitted", "Certified"];

const toObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("invalid id");
  }
  return new mongoose.Types.ObjectId(String(id));
};

const passRate = (results = []) => {
  const pass = results.find((row) => row.key === "Pass")?.count ?? 0;
  const fail = results.find((row) => row.key === "Fail")?.count ?? 0;
  return pass + fail ? Math.round((pass / (pass + fail)) * 1000) / 10 : null;
};

class AnalyticsService {
  constructor() {
    this.repository = new AnalyticsRepository();
  }

  async admin() {
    const [batches, partners, centres, candidates, results, certificates, partnerApps, agencyApps] = await Promise.all([
      this.repository.batchSummary({}),
      this.repository.topTrainingPartners({}),
      this.repository.centreSchemeStatus({}),
      this.repository.candidateSummary(),
      this.repository.resultSummary(),
      this.repository.certificateSummary(),
      this.repository.partnerApplications(),
      this.repository.agencyApplications(),
    ]);
    const totals = batches.totals[0] ?? {};
    return {
      totals: {
        batches: totals.batches ?? 0,
        candidates: totals.candidates ?? 0,
        revenue: totals.revenue ?? 0,
        certificates: certificates.total[0]?.count ?? 0,
        passRate: passRate(results.results),
        trainingPartners: ensureKeys(partnerApps, ["Approved", "Pending", "Rejected"]),
        agencies: ensureKeys(agencyApps, ["Approved", "Pending", "Rejected"]),
      },
      monthly: monthlySeries(batches.monthly, candidates.monthly, certificates.monthly),
      batchStages: ensureKeys(batches.stages, BATCH_STAGES),
      schemes: batches.schemes,
      states: batches.states,
      courses: batches.courses,
      topPartners: partners,
      centres: ensureKeys(centres, ["Approved", "Pending", "Rejected"]),
      gender: candidates.gender,
      results: ensureKeys(results.results, ["Pass", "Fail"]),
      grades: results.grades,
      courseResults: results.courses,
    };
  }

  async trainingPartner(tpId) {
    const id = toObjectId(tpId);
    const { Center, Trainer } = this.repository.models;
    const [batches, centres, candidates, results, centreCount, trainerCount, schemeStatus] = await Promise.all([
      this.repository.batchSummary({ trainingOrganizationId: id }),
      this.repository.candidatesPerCentre({ trainingOrganizationId: id }),
      this.repository.candidateSummary(null, { trainingPartner: id }),
      this.repository.resultSummary({ batchMatch: { trainingOrganizationId: id } }),
      this.repository.count(Center, { trainingOrganizationId: id }),
      this.repository.count(Trainer, { trainingPartner: id }),
      this.repository.centreSchemeStatus({ trainingOrganizationId: id }),
    ]);
    const certificates = await this.repository.certificateSummary({ TrainingPartnerId: id });
    const totals = batches.totals[0] ?? {};
    return {
      totals: {
        batches: totals.batches ?? 0,
        candidates: totals.candidates ?? 0,
        centres: centreCount,
        trainers: trainerCount,
        certificates: certificates.total[0]?.count ?? 0,
        passRate: passRate(results.results),
        feesPaid: totals.revenue ?? 0,
      },
      monthly: monthlySeries(candidates.monthly, certificates.monthly),
      batchStages: ensureKeys(batches.stages, BATCH_STAGES),
      centres,
      courses: batches.courses,
      centreApprovals: ensureKeys(schemeStatus, ["Approved", "Pending", "Rejected"]),
      gender: candidates.gender,
      results: ensureKeys(results.results, ["Pass", "Fail"]),
      grades: results.grades,
      courseResults: results.courses,
    };
  }

  async sna(user) {
    const { scheme, state } = user;
    if (!scheme || !state) {
      throw AppError.forbidden("SNA account has no scheme or state");
    }
    const batchMatch = { scheme, state };
    const [batches, partners, centres, candidates, results] = await Promise.all([
      this.repository.batchSummary(batchMatch),
      this.repository.topTrainingPartners(batchMatch),
      this.repository.centreSchemeStatus({ state, "schemes.schemeName": scheme }, scheme),
      this.repository.candidateSummary(batchMatch),
      this.repository.resultSummary({ batchMatch }),
    ]);
    const certificates = await this.repository.certificateSummary({ scheme, state });
    const totals = batches.totals[0] ?? {};
    return {
      scope: { scheme, state },
      totals: {
        batches: totals.batches ?? 0,
        candidates: totals.candidates ?? 0,
        certificates: certificates.total[0]?.count ?? 0,
        passRate: passRate(results.results),
        partners: partners.length,
      },
      monthly: monthlySeries(batches.monthly, certificates.monthly),
      batchStages: ensureKeys(batches.stages, BATCH_STAGES),
      centres: ensureKeys(centres, ["Approved", "Pending", "Rejected"]),
      topPartners: partners,
      courses: batches.courses,
      gender: candidates.gender,
      results: ensureKeys(results.results, ["Pass", "Fail"]),
      grades: results.grades,
      courseResults: results.courses,
    };
  }

  // ** LC/RC: everything corporate, plus what is waiting for its decision
  async lcrc() {
    const { Batch, Exam, Scheme } = this.repository.models;
    const schemeNames = await Scheme.find({ schemeType: "Corporate" }).distinct("name");
    const batchIds = await Batch.find({ schemeType: "Corporate" }).distinct("_id");
    const batchMatch = { schemeType: "Corporate" };
    const centreMatch = { "schemes.schemeName": { $in: schemeNames } };
    const [batches, partners, centres, candidates, results, certificates, pendingBatches, pendingResults] = await Promise.all([
      this.repository.batchSummary(batchMatch),
      this.repository.topTrainingPartners(batchMatch),
      this.repository.centreSchemeStatus(centreMatch, schemeNames),
      this.repository.candidateSummary(batchMatch),
      this.repository.resultSummary({ batchMatch }),
      this.repository.certificateSummary({ batchId: { $in: batchIds } }),
      this.repository.count(Batch, { ...batchMatch, batchActivePermission: true, approvedByGovernmentBody: false }),
      this.repository.count(Exam, { batchId: { $in: batchIds }, status: "completed", certificateIssued: false }),
    ]);
    const totals = batches.totals[0] ?? {};
    const centreStatus = ensureKeys(centres, ["Approved", "Pending", "Rejected"]);
    return {
      totals: {
        batches: totals.batches ?? 0,
        candidates: totals.candidates ?? 0,
        certificates: certificates.total[0]?.count ?? 0,
        passRate: passRate(results.results),
        partners: partners.length,
        pendingCentres: centreStatus.find((row) => row.key === "Pending").count,
        pendingBatches,
        pendingResults,
      },
      monthly: monthlySeries(batches.monthly, certificates.monthly),
      batchStages: ensureKeys(batches.stages, BATCH_STAGES),
      centres: centreStatus,
      topPartners: partners,
      courses: batches.courses,
      gender: candidates.gender,
      results: ensureKeys(results.results, ["Pass", "Fail"]),
      grades: results.grades,
      courseResults: results.courses,
    };
  }

  async agency(agencyId) {
    const id = toObjectId(agencyId);
    const { Assessor } = this.repository.models;
    const [exams, results, invoices, assessorCount] = await Promise.all([
      this.repository.examSummary({ assesmentAgencyId: id }),
      this.repository.resultSummary({ examMatch: { assesmentAgencyId: id } }),
      this.repository.invoiceSummary(id),
      this.repository.count(Assessor, { AssesmentAgency: id }),
    ]);
    const totals = exams.totals[0] ?? {};
    return {
      totals: {
        exams: totals.exams ?? 0,
        candidates: totals.candidates ?? 0,
        assessed: totals.present ?? 0,
        certificates: totals.certificates ?? 0,
        assessors: assessorCount,
        passRate: passRate(results.results),
        earningsPaid: invoices.paid ?? 0,
        earningsUnpaid: invoices.unpaid ?? 0,
      },
      monthly: monthlySeries(exams.monthly),
      examStages: ensureKeys(exams.stages, EXAM_STAGES),
      assessors: exams.assessors,
      results: ensureKeys(results.results, ["Pass", "Fail"]),
      grades: results.grades,
      courseResults: results.courses,
    };
  }
}

export default AnalyticsService;
