import { StatusCodes } from "http-status-codes";
import AssesmentAgencyService from "../service/Assesment-Agency.js";

const assesmentAgencyService = new AssesmentAgencyService();

const createAssesmentAgency = async (req, res) => {
  try {
    const payload = req.body;
    const response = await assesmentAgencyService.createAgency(payload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "Agency created sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "something went wrong",
      success: false,
      error: error.message,
    });
  }
};

const assesmentAgencylogin = async (req, res) => {
  try {
    console.log(req.body);
    const response = await assesmentAgencyService.login(
      req.body.email,
      req.body.password
    );
    return res.status(StatusCodes.ACCEPTED).json({
      success: true,
      data: response,
      message: "login sucessfull",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "something went wrong",
      success: false,
      error: error.message,
    });
  }
};

const updateAssesmentAgencyStatusToApproved = async (req, res) => {
  try {
    const response = await assesmentAgencyService.updateStatusToApproved(
      req.params.id
    );
    return res.status(200).json({
      success: true,
      data: response,
      message: "Application approved sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "something went wrong in updating status",
    });
  }
};

const updateAssesmentAgencyStatusToRejected = async (req, res) => {
  try {
    const response = await assesmentAgencyService.updateStatusToRejected(
      req.params.id
    );
    return res.status(200).json({
      success: true,
      data: response,
      message: "Application rejected sucessfully sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "something went wrong in updating status",
    });
  }
};

export {
  createAssesmentAgency,
  assesmentAgencylogin,
  updateAssesmentAgencyStatusToApproved,
  updateAssesmentAgencyStatusToRejected,
};
