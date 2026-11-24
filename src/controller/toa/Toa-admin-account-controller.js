import { StatusCodes } from "http-status-codes";
import ToaAdminAccountService from "../../service/toa/ToaAdminAccountService.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { auditContext } from "../../utils/audit.js";

const service = new ToaAdminAccountService();
const send = (res, data, message, status = StatusCodes.OK) => res.status(status).json({ success: true, data, message });

// ** CUTM admin: RailTel ToA admin accounts
export const createToaAdmin = asyncHandler(async (req, res) =>
  send(res, await service.create(req.body, req.user.id, auditContext(req)), "ToA admin created, login details are emailed", StatusCodes.CREATED)
);
export const listToaAdmins = asyncHandler(async (req, res) => send(res, await service.list(), "ToA admins fetched"));
export const setToaAdminStatus = asyncHandler(async (req, res) =>
  send(res, await service.setStatus(req.params.id, req.body?.status, req.body?.reason, auditContext(req)), "status updated")
);
export const unlockToaAdmin = asyncHandler(async (req, res) => send(res, await service.unlock(req.params.id, auditContext(req)), "account unlocked"));
export const resetToaAdminPassword = asyncHandler(async (req, res) =>
  send(res, await service.resetPassword(req.params.id, auditContext(req)), "a new temporary password is emailed")
);
