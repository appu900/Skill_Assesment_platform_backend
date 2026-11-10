import { StatusCodes } from "http-status-codes";
import ToaTrainee from "../../models/toa/ToaTrainee.model.js";
import ToaBatch from "../../models/toa/ToaBatch.model.js";
import ToaResult from "../../models/toa/ToaResult.model.js";
import ToaCertificate from "../../models/toa/ToaCertificate.model.js";
import ToaAttendance from "../../models/toa/ToaAttendance.model.js";
import ToaResultService from "../../service/toa/ToaResultService.js";
import { listNotifications, markRead } from "../../service/toa/ToaNotificationService.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import ROLES from "../../utils/roles.js";
import { sendFile } from "../../utils/toa/excel.js";

const results = new ToaResultService();
const send = (res, data, message = "ok") => res.status(StatusCodes.OK).json({ success: true, data, message });

// ** an assessor sees only their own batches, attendance, published results and certificates
export const assessorOverview = asyncHandler(async (req, res) => {
  const id = req.toaTraineeId;
  const [trainee, batches, published, certificates] = await Promise.all([
    ToaTrainee.findById(id).populate("toaTpId", "organizationName tpCode"),
    ToaBatch.find({ "trainees.trainee": id, status: { $in: ["approved", "completed"] } }).select("batchCode programmeName trainingMode startDate endDate venue meetingLink status sessions resultsStatus").lean(),
    ToaResult.find({ trainee: id, status: { $in: ["published", "withheld"] } }).lean(),
    ToaCertificate.find({ trainee: id, status: "valid" }).select("certificateNumber issueDate batch verifyCode snapshot.programmeName").lean(),
  ]);
  const marks = await ToaAttendance.find({ trainee: id }).lean();
  const statusOf = new Map(marks.map((row) => [String(row.session), row.status]));
  send(res, {
    profile: trainee,
    batches: batches.map((batch) => {
      const approved = batch.sessions.filter((session) => session.attendanceStatus === "approved");
      const present = approved.filter((session) => statusOf.get(String(session._id)) === "present").length;
      return {
        ...batch,
        sessions: batch.sessions.map((session) => ({ _id: session._id, date: session.date, startTime: session.startTime, endTime: session.endTime, topic: session.topic, approved: session.attendanceStatus === "approved", status: session.attendanceStatus === "approved" ? statusOf.get(String(session._id)) ?? null : null })),
        attendancePercent: approved.length ? Math.round((present / approved.length) * 1000) / 10 : null,
        result: published.find((row) => String(row.batch) === String(batch._id)) ?? null,
        certificate: certificates.find((row) => String(row.batch) === String(batch._id)) ?? null,
      };
    }),
  });
});

export const assessorNotifications = asyncHandler(async (req, res) => send(res, await listNotifications(ROLES.TOA_ASSESSOR, req.toaTraineeId)));
export const assessorReadNotification = asyncHandler(async (req, res) => send(res, await markRead(ROLES.TOA_ASSESSOR, req.toaTraineeId, req.params.id)));

export const assessorCertificatePdf = asyncHandler(async (req, res) => {
  const certificate = await results.certificate(req.params.id);
  if (String(certificate.trainee) !== req.toaTraineeId) throw AppError.forbidden("This is not your certificate");
  sendFile(res, await results.certificatePdf(certificate), `${certificate.snapshot.registrationId}-certificate.pdf`, "application/pdf");
});
