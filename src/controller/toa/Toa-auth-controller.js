import { StatusCodes } from "http-status-codes";
import ToaAuthService from "../../service/toa/ToaAuthService.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { auditContext } from "../../utils/audit.js";

const send = (res, data, message, status = StatusCodes.OK) => res.status(status).json({ success: true, data, message });

// ** the same five handlers for each kind of ToA account (training partner, assessor)
function authHandlers(kind, idOf) {
  const service = new ToaAuthService(kind);
  return {
    login: asyncHandler(async (req, res) => send(res, await service.login(req.body?.email, req.body?.password, auditContext(req)), "login success")),
    forgotPassword: asyncHandler(async (req, res) => send(res, await service.forgotPassword(req.body?.email, auditContext(req)), "If the email is registered, a reset link has been sent")),
    resetPassword: asyncHandler(async (req, res) => send(res, await service.resetPassword(req.body?.token, req.body?.newPassword, auditContext(req)), "password saved, please log in")),
    changePassword: asyncHandler(async (req, res) => send(res, await service.changePassword(idOf(req), req.body?.currentPassword, req.body?.newPassword, auditContext(req)), "password changed")),
    profile: asyncHandler(async (req, res) => send(res, await service.getProfile(idOf(req)), "profile fetched")),
  };
}

export const tpAuth = authHandlers("tp", (req) => req.toaTpId);
export const assessorAuth = authHandlers("assessor", (req) => req.toaTraineeId);
