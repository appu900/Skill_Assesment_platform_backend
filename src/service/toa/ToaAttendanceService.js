import mongoose from "mongoose";
import ToaAttendance from "../../models/toa/ToaAttendance.model.js";
import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";
import { notify } from "./ToaNotificationService.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { audit } from "../../utils/audit.js";
import { renderPdf } from "../../utils/toa/render.js";
import { workbookBuffer } from "../../utils/toa/excel.js";
import { day } from "./ToaInvoiceService.js";
import { rosterIds } from "../../utils/toa/sequence.js";

const STATUSES = ["present", "absent", "leave"];
const MARKABLE = ["not_marked", "draft", "returned"];
const LABEL = { present: "Present", absent: "Absent", leave: "Leave" };

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

class ToaAttendanceService {
  session(batch, sessionId) {
    const session = mongoose.isValidObjectId(sessionId) ? batch.sessions.id(sessionId) : null;
    if (!session) throw AppError.notFound("session not found");
    return session;
  }

  assertBatchRunning(batch) {
    if (!["approved", "completed"].includes(batch.status)) throw new AppError("attendance can be recorded only for batches approved by CUTM");
  }

  // ** TP marks (or corrects) a session; every change is audited with the old and new status
  async mark(batch, sessionId, records, actor, context) {
    this.assertBatchRunning(batch);
    const session = this.session(batch, sessionId);
    if (!MARKABLE.includes(session.attendanceStatus)) throw new AppError(`this session's attendance is ${session.attendanceStatus} and cannot be changed`);
    if (session.date > endOfToday()) throw new AppError("attendance cannot be recorded for a future session");
    if (!Array.isArray(records) || records.length === 0) throw new AppError("no attendance was sent");
    const roster = new Set(rosterIds(batch));
    for (const record of records) {
      if (!roster.has(String(record.trainee))) throw new AppError("an assessor in the list is not in this batch");
      if (!STATUSES.includes(record.status)) throw new AppError(`status must be ${STATUSES.join(", ")}`);
    }
    const existing = await ToaAttendance.find({ batch: batch._id, session: session._id }).lean();
    const previous = new Map(existing.map((row) => [String(row.trainee), row.status]));
    const changes = records.filter((record) => previous.get(String(record.trainee)) !== record.status);
    if (changes.length) {
      await ToaAttendance.bulkWrite(
        changes.map((record) => ({
          updateOne: {
            filter: { batch: batch._id, session: session._id, trainee: record.trainee },
            update: { $set: { status: record.status, toaTpId: batch.toaTpId, markedBy: actor.id, markedByRole: actor.role } },
            upsert: true,
          },
        }))
      );
      await audit(context, {
        module: "toa",
        entity: "ToaBatch",
        entityId: batch._id,
        action: "attendance_marked",
        note: `session ${day(session.date)}`,
        before: Object.fromEntries(changes.map((record) => [String(record.trainee), previous.get(String(record.trainee)) ?? null])),
        after: Object.fromEntries(changes.map((record) => [String(record.trainee), record.status])),
      });
    }
    if (session.attendanceStatus === "not_marked") session.attendanceStatus = "draft";
    await batch.save();
    return this.sessionView(batch, session);
  }

  async attachEvidence(batch, sessionId, file, context) {
    this.assertBatchRunning(batch);
    const session = this.session(batch, sessionId);
    if (!MARKABLE.includes(session.attendanceStatus)) throw new AppError("the attendance of this session can no longer be changed");
    if (!file) throw new AppError("no file was uploaded");
    session.evidenceKey = file.key;
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "attendance_evidence_uploaded", note: `session ${day(session.date)}` });
    return session;
  }

  async submit(batch, sessionId, context) {
    this.assertBatchRunning(batch);
    const session = this.session(batch, sessionId);
    if (!["draft", "returned"].includes(session.attendanceStatus)) throw new AppError("mark the attendance before submitting it");
    const marked = await ToaAttendance.countDocuments({ batch: batch._id, session: session._id, trainee: { $in: rosterIds(batch) } });
    if (marked < batch.trainees.length) throw new AppError(`${batch.trainees.length - marked} assessor(s) are not marked yet`);
    session.attendanceStatus = "submitted";
    session.attendanceSubmittedAt = new Date();
    session.attendanceRemarks = null;
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: "attendance_submitted", note: `session ${day(session.date)}` });
    return session;
  }

  // ** CUTM approves a submitted session (it is locked) or returns it with remarks (the TP can correct it)
  async decide(batch, sessionId, decision, remarks, context) {
    const session = this.session(batch, sessionId);
    if (!["approve", "return"].includes(decision)) throw new AppError("decision must be approve or return");
    const note = String(remarks ?? "").trim().slice(0, 500);
    if (decision === "return" && !note) throw new AppError("Please add remarks for the training partner");
    if (decision === "approve" && session.attendanceStatus !== "submitted") throw new AppError("only submitted attendance can be approved");
    if (decision === "return" && !["submitted", "approved"].includes(session.attendanceStatus)) throw new AppError("only submitted or approved attendance can be returned");
    if (decision === "return" && batch.resultsStatus === "published") throw new AppError("results of this batch are published; attendance can no longer be reopened");
    const before = { attendanceStatus: session.attendanceStatus };
    session.attendanceStatus = decision === "approve" ? "approved" : "returned";
    session.attendanceDecidedAt = new Date();
    session.attendanceRemarks = note || null;
    await batch.save();
    await audit(context, { module: "toa", entity: "ToaBatch", entityId: batch._id, action: `attendance_${session.attendanceStatus}`, note: `session ${day(session.date)}${note ? `: ${note}` : ""}`, before, after: { attendanceStatus: session.attendanceStatus } });
    if (decision === "return") {
      const tp = await ToaTrainingPartner.findById(batch.toaTpId).select("email").lean();
      await notify({
        role: ROLES.TOA_TRAINING_PARTNER,
        id: batch.toaTpId,
        email: tp?.email,
        title: `Attendance of ${batch.batchCode} returned`,
        message: `CUTM returned the attendance of the ${day(session.date)} session of batch ${batch.batchCode}. Remarks: ${note}`,
        link: `/toa/batches/${batch._id}`,
      });
    }
    return session;
  }

  async sessionView(batch, session) {
    const rows = await ToaAttendance.find({ batch: batch._id, session: session._id }).lean();
    return { session, records: rows.map((row) => ({ trainee: row.trainee, status: row.status })) };
  }

  // ** assessor x session matrix plus the attendance % over CUTM-approved sessions (what eligibility uses)
  async matrix(batch) {
    await batch.populate("trainees.trainee", "name registrationId");
    const rows = await ToaAttendance.find({ batch: batch._id }).lean();
    const byKey = new Map(rows.map((row) => [`${row.trainee}:${row.session}`, row.status]));
    const approvedSessions = batch.sessions.filter((session) => session.attendanceStatus === "approved");
    const trainees = batch.trainees.map(({ trainee }) => {
      const statuses = Object.fromEntries(batch.sessions.map((session) => [String(session._id), byKey.get(`${trainee._id}:${session._id}`) ?? null]));
      const present = approvedSessions.filter((session) => statuses[String(session._id)] === "present").length;
      return {
        trainee: { _id: trainee._id, name: trainee.name, registrationId: trainee.registrationId },
        statuses,
        present,
        percent: approvedSessions.length ? Math.round((present / approvedSessions.length) * 1000) / 10 : null,
      };
    });
    return { sessions: batch.sessions, approvedSessions: approvedSessions.length, trainees };
  }

  // ** attendance % per assessor id over approved sessions (eligibility)
  async percentages(batch) {
    const approved = batch.sessions.filter((session) => session.attendanceStatus === "approved").map((session) => session._id);
    const rows = await ToaAttendance.aggregate([
      { $match: { batch: batch._id, session: { $in: approved }, status: "present" } },
      { $group: { _id: "$trainee", present: { $sum: 1 } } },
    ]);
    const present = new Map(rows.map((row) => [String(row._id), row.present]));
    return { approvedSessions: approved.length, percentOf: (id) => (approved.length ? ((present.get(String(id)) ?? 0) / approved.length) * 100 : 0) };
  }

  // ** printable sheet of one session from the approved roster (blank status when not marked yet)
  async sheetPdf(batch, sessionId) {
    const session = this.session(batch, sessionId);
    await batch.populate("trainees.trainee", "name registrationId");
    const rows = await ToaAttendance.find({ batch: batch._id, session: session._id }).lean();
    const status = new Map(rows.map((row) => [String(row.trainee), LABEL[row.status]]));
    const tp = await ToaTrainingPartner.findById(batch.toaTpId).select("organizationName").lean();
    return renderPdf("attendance_sheet", {
      batchCode: batch.batchCode,
      programmeName: batch.programmeName,
      sessionDate: day(session.date),
      sessionTime: [session.startTime, session.endTime].filter(Boolean).join(" – "),
      sessionTopic: session.topic ?? "",
      trainingPartner: tp?.organizationName,
      trainingMode: batch.trainingMode,
      venue: batch.venue ?? "",
      trainerName: batch.trainerName ?? "",
      rows: batch.trainees.map(({ trainee }) => ({ registrationId: trainee.registrationId, name: trainee.name, status: status.get(String(trainee._id)) ?? "" })),
    }, { toaTpId: batch.toaTpId });
  }

  async reportXlsx(batch) {
    const { sessions, trainees } = await this.matrix(batch);
    const columns = [
      { header: "Registration ID", key: "registrationId", width: 22 },
      { header: "Assessor", key: "name", width: 28 },
      ...sessions.map((session, index) => ({ header: `${day(session.date)} (${session.attendanceStatus.replace("_", " ")})`, key: `s${index}`, width: 20 })),
      { header: "Attendance % (approved sessions)", key: "percent", width: 18 },
    ];
    const rows = trainees.map((row) => ({
      registrationId: row.trainee.registrationId,
      name: row.trainee.name,
      percent: row.percent ?? "",
      ...Object.fromEntries(sessions.map((session, index) => [`s${index}`, LABEL[row.statuses[String(session._id)]] ?? ""])),
    }));
    return workbookBuffer("Attendance", columns, rows, { title: `Attendance – ${batch.batchCode} · ${batch.programmeName}` });
  }
}

export default ToaAttendanceService;
