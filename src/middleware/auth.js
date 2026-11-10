import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import serverConfig from "../config/serverConfig.js";
import ROLES, { CORE_ROLES } from "../utils/roles.js";

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

// ** allow only the given roles, must run after authenticate
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Unauthorized Access",
      error: "UnAuthorizedAccess",
    });
  }
  next();
};

// ** authenticate + authorize in one step; with no roles any logged in user of the skill portal is allowed
// ** (RailTel ToA accounts are kept out of every existing route, they only reach /v1/toa)
const allow = (...roles) => [authenticate, authorize(...(roles.length === 0 ? CORE_ROLES : roles))];

export { authenticate, optionalAuthenticate, authorize, allow };
