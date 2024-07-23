import SchemeService from "../service/SchemeService.js";
import { StatusCodes } from "http-status-codes";

const schemeService = new SchemeService();

const createScheme = async (req, res) => {
  try {
    const response = await schemeService.create(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "Scheme created successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const fetchAllSchems = async (req, res) => {
  try {
    const response = await schemeService.getAllSchems();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "All Schemes fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const fetchAllSchemeOfSchemeType = async (req, res) => {
  try {
    const response = await schemeService.getSchemeBySchemeType(
      req.body.schemeType
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "All Schemes fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

export { createScheme, fetchAllSchems,fetchAllSchemeOfSchemeType };
