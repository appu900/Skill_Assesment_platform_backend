import { StatusCodes } from "http-status-codes";
import SnaService from "../service/SnaService.js";

const snaService = new SnaService();

const createSNA = async (req, res) => {
  try {
    const payload = req.body;
    const response = await snaService.create(payload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "SNA created successfully",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

const snaLogin = async (req, res) => {
  try {
    const { email, password,scheme } = req.body;
    const response = await snaService.login(email, password, scheme);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "login success",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

export { createSNA,snaLogin };
