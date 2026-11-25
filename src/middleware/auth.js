import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import serverConfig from "../config/serverConfig.js";
import ROLES, { CORE_ROLES, TP_NOT_APPROVED } from "../utils/roles.js";
import TrainingPartner from "../models/TrainingPartner.model.js";

export { ROLES };

// ** verify the token and attach the logged in user ({ id, role, ... }) to req.user
const authenticate = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "No Token found",
      error: "UnAuthorized Access",
    });
  }
  try {
    const userData = jwt.verify(token, serverConfig.JWT_SECRET);
    req.user = userData;

    // ** kept because existing controllers read these
    if (userData.role === ROLES.TRAINING_PARTNER) {
      req.trainingPartnerId = userData.id;
    }
    if (userData.role === ROLES.ASSESMENT_AGENCY) {
      req.assesmentAgencyName = userData.name;
    }
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Invalid token",
      error: "Invalid Token",
    });
  }
};

// ** like authenticate, but lets requests without a token through (req.user stays undefined)
const optionalAuthenticate = (req, res, next) => {
  if (!req.headers["x-access-token"]) {
    return next();
  }
  return authenticate(req, res, next);
};

// ** a training partner only works while its application is approved: checked on every request,
// ** so a session opened before a rejection (or an old token) stops at once (client, 2026-11-25)
const assertApprovedTrainingPartner = async (req, res, next) => {
  try {
    const tp = await TrainingPartner.findById(req.user.id).select("applicationStatus").lean();
    if (!tp) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Account not found", error: "SessionEnded" });
    }
    if (tp.applicationStatus !== "Approved") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: tp.applicationStatus === "Pending" ? "Your application is awaiting admin approval." : "Your application was not approved.",
        error: TP_NOT_APPROVED,
        applicationStatus: tp.applicationStatus,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// ** allow only the given roles, must run after authenticate
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Unauthorized Access",
      error: "UnAuthorizedAccess",
    });
  }
  if (req.user.role === ROLES.TRAINING_PARTNER) return assertApprovedTrainingPartner(req, res, next);
  next();
};

// ** authenticate + authorize in one step; with no roles any logged in user of the skill portal is allowed
// ** (RailTel ToA accounts are kept out of every existing route, they only reach /v1/toa)
const allow = (...roles) => [authenticate, authorize(...(roles.length === 0 ? CORE_ROLES : roles))];

export { authenticate, optionalAuthenticate, authorize, allow };
