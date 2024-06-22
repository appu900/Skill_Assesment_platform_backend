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

const getAssesmentAgencyById = async (req, res) => {
  try {
    const assesmentAgency = await assesmentAgencyService.getAssesmentAgencyById(
      req.params.id
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: assesmentAgency,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "something went wrong in updating status",
    });
  }
};

const getAllAssesmentAgency = async (req, res) => {
  try {
    const response = await assesmentAgencyService.getAllAssesmentAgency();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

const getAllPendingAssesmentAgency = async (req, res) => {
  try {
    const response =
      await assesmentAgencyService.getAllPendingAssesmentAgencyApplocations();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

const getAllApprovedAssesmentAgency = async (req, res) => {
  try {
    const response =
      await assesmentAgencyService.getAllApprovedAssesmentAgency();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

export {
  createAssesmentAgency,
  assesmentAgencylogin,
  updateAssesmentAgencyStatusToApproved,
  updateAssesmentAgencyStatusToRejected,
  getAssesmentAgencyById,
  getAllAssesmentAgency,
  getAllPendingAssesmentAgency,
  getAllApprovedAssesmentAgency,
};
