import { StatusCodes } from "http-status-codes";
import LcrcService from "../service/LcrcService.js";
import CenterService from "../service/centerService.js";
import BatchService from "../service/Batch-service.js";
import ExamService from "../service/Exam-service.js";
import asyncHandler from "../utils/asyncHandler.js";

const lcrcService = new LcrcService();
const centerService = new CenterService();
const batchService = new BatchService();
const examService = new ExamService();

const send = (res, data, message, status = StatusCodes.OK) => res.status(status).json({ success: true, data, message });

// ** accounts (admin)
const createLcrc = asyncHandler(async (req, res) =>
  send(res, await lcrcService.create(req.body), "LC/RC created, login details are emailed", StatusCodes.CREATED)
);
const getAllLcrc = asyncHandler(async (req, res) => send(res, await lcrcService.getAll(), "LC/RC accounts fetched"));
const updateLcrc = asyncHandler(async (req, res) => send(res, await lcrcService.update(req.params.id, req.body), "LC/RC updated"));
const resetLcrcPassword = asyncHandler(async (req, res) =>
  send(res, await lcrcService.resetPassword(req.params.id), "a new password is emailed to the LC/RC")
);

// ** own account (LC/RC)
const lcrcLogin = asyncHandler(async (req, res) => send(res, await lcrcService.login(req.body.email, req.body.password), "login success"));
const getLcrcProfile = asyncHandler(async (req, res) => send(res, await lcrcService.getProfile(req.user.id), "profile fetched"));
const changeLcrcPassword = asyncHandler(async (req, res) =>
  send(res, await lcrcService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword), "password changed")
);

// ** corporate approvals (LC/RC or admin)
const getPendingCorporateCenters = asyncHandler(async (req, res) =>
  send(res, await centerService.getPendingCorporateCenters(), "pending corporate centres fetched")
);
const approveCorporateCenter = asyncHandler(async (req, res) =>
  send(res, await centerService.decideCorporateCenter(req.params.id, req.body.schemeName, true), "centre approved")
);
const rejectCorporateCenter = asyncHandler(async (req, res) =>
  send(res, await centerService.decideCorporateCenter(req.params.id, req.body.schemeName, false, req.body.reason), "centre rejected")
);
const getCorporateBatches = asyncHandler(async (req, res) =>
  send(res, await batchService.getCorporateBatches(req.query.status), "corporate batches fetched")
);
const approveCorporateBatch = asyncHandler(async (req, res) => send(res, await batchService.approveCorporateBatch(req.params.id), "batch approved"));
const rejectCorporateBatch = asyncHandler(async (req, res) =>
  send(res, await batchService.rejectCorporateBatch(req.params.id, req.body.reason), "batch sent back to the training partner")
);
const getResultsForReview = asyncHandler(async (req, res) =>
  send(res, await examService.getResultsForReview(req.user, req.query.status), "results fetched")
);
const approveResult = asyncHandler(async (req, res) =>
  send(res, await examService.approveResult(req.params.id, req.user), "result approved, certificates are being generated", StatusCodes.ACCEPTED)
);
const rejectResult = asyncHandler(async (req, res) =>
  send(res, await examService.rejectResult(req.params.id, req.body.reason, req.user), "result sent back to the assessment agency")
);

export {
  createLcrc,
  getAllLcrc,
  updateLcrc,
  resetLcrcPassword,
  lcrcLogin,
  getLcrcProfile,
  changeLcrcPassword,
  getPendingCorporateCenters,
  approveCorporateCenter,
  rejectCorporateCenter,
  getCorporateBatches,
  approveCorporateBatch,
  rejectCorporateBatch,
  getResultsForReview,
  approveResult,
  rejectResult,
};
