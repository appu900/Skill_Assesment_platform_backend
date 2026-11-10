import { StatusCodes } from "http-status-codes";
import { authenticate } from "./auth.js";
import ROLES from "../utils/roles.js";
import ToaTrainingPartner from "../models/toa/ToaTrainingPartner.model.js";
import ToaTrainee from "../models/toa/ToaTrainee.model.js";

const deny = (res, status, message, code) => res.status(status).json({ success: false, message, error: code });

const ACCOUNTS = {
  [ROLES.TOA_TRAINING_PARTNER]: { Model: ToaTrainingPartner, fields: "status tokenVersion mustChangePassword" },
  [ROLES.TOA_ASSESSOR]: { Model: ToaTrainee, fields: "status portalEnabled tokenVersion mustChangePassword password" },
};

// ** a ToA account on every request: it must still exist, be allowed to sign in and the token must be current
// ** (suspension or a password change ends older sessions immediately, not when the jwt expires)
const checkAccount = (role, allowPendingPasswordChange) => async (req, res, next) => {
  if (req.user?.role !== role) return deny(res, StatusCodes.FORBIDDEN, "Unauthorized Access", "UnAuthorizedAccess");
  try {
    const { Model, fields } = ACCOUNTS[role];
    const doc = await Model.findById(req.user.id).select(fields);
    if (!doc || doc.signInBlockReason() || (doc.tokenVersion ?? 0) !== (req.user.tv ?? 0)) {
      return deny(res, StatusCodes.UNAUTHORIZED, "Your session has ended, please log in again", "SessionEnded");
    }
    if (doc.mustChangePassword && !allowPendingPasswordChange) {
      return deny(res, StatusCodes.FORBIDDEN, "Please change your temporary password first", "PasswordChangeRequired");
    }
    if (role === ROLES.TOA_TRAINING_PARTNER) req.toaTpId = String(req.user.id);
    if (role === ROLES.TOA_ASSESSOR) req.toaTraineeId = String(req.user.id);
    next();
  } catch (error) {
    next(error);
  }
};

// ** every ToA training partner route
export const requireToaTp = [authenticate, checkAccount(ROLES.TOA_TRAINING_PARTNER, false)];
// ** profile + change password stay reachable while the temporary password has not been replaced
export const requireToaTpPendingPassword = [authenticate, checkAccount(ROLES.TOA_TRAINING_PARTNER, true)];
// ** assessor (trainee) portal
export const requireToaAssessor = [authenticate, checkAccount(ROLES.TOA_ASSESSOR, true)];
