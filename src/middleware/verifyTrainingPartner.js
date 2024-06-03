import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

const verifyIsTrainingPartner = async (req, res, next) => {
  try {

    const token = req.headers["x-access-token"];
    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "No Token found",
        error: "UnAuthrorized Access",
      });
    }

    const userData = jwt.verify(token, "this is a secrete a key");
    console.log(userData);
    if (userData.role !== "Admin") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Unauthorized Access",
        error: "UnAuthorizedAccess",
      });
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

export default verifyIsTrainingPartner;
