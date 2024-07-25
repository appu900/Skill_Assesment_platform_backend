import { StatusCodes } from "http-status-codes";
import AssesmentAgencyService from "../service/Assesment-Agency.js";
import upload from "../config/s3-imageUpload-config.js";

const assesmentAgencyService = new AssesmentAgencyService();
const fileUploader = upload.fields([
  { name: "LETTER_OF_NCVET", maxCount: 1 },
  { name: "logo", maxCount: 1 },
]);

const createAssesmentAgency = async (req, res) => {
  try {
    fileUploader(req, res, async (err) => {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "something went wrong in fileUpload",
          error: err.message,
        });
      }
      const payload = req.body;
      
      payload.LETTER_OF_NCVET = req.files["LETTER_OF_NCVET"][0].location;
      payload.logo = req.files["logo"][0].location;
      console.log(payload);
      const assesmentAgency = await assesmentAgencyService.createAgency(
        payload
      );
      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: assesmentAgency,
        message: "Assesment Agency created sucessfully",
      });
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
    const percentage = req.body.percentage;
    const response = await assesmentAgencyService.updateStatusToApproved(
      req.params.id,
      percentage
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

const filterAssesmentgency = async (req, res) => {
  try {
    const response = await assesmentAgencyService.fiterData(req.query);
    console.log(response);
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

const updateBankDetails = async (req, res) => {
  try {
    const response = await assesmentAgencyService.addbankDetails(
      req.params.id,
      req.body.accountNumber,
      req.body.IFSC_Code,
      req.body.bankName,
      req.body.branchName
    )
    return res.status(200).json({
      success: true,
      data: response,
      message: "Bank details added sucessfully",
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
  getAssesmentAgencyById,
  getAllAssesmentAgency,
  getAllPendingAssesmentAgency,
  getAllApprovedAssesmentAgency,
  filterAssesmentgency,
  updateBankDetails
};
