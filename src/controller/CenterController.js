import { StatusCodes } from "http-status-codes";
import CenterService from "../service/centerService.js";
import upload from "../config/s3-imageUpload-config.js";

const singleUploder = upload.single("letter");
const centerService = new CenterService();

const createCenter = async (req, res) => {
  try {
    singleUploder(req, res, async (err) => {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: err.message,
          message: "Cannot upload file",
        });
      }
      const payload = req.body;
      payload.trainingOrganizationId = req.trainingPartnerId;
      payload.sanction_order_letter = req.file?.location;
      const response = await centerService.create(payload);
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Center created",
        data: response,
      });
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot create center",
    });
  }
};

const getAllCentersOfTrainingPartner = async (req, res) => {
  try {
    const response = await centerService.get(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Centers fetched",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot fetch centers",
    });
  }
};

const filterCenterBySchemeAndState = async (req, res) => {
  try {
    const query = req.query;
    const response = await centerService.filterCentersData(query);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Centers fetched",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot approve centers",
    });
  }
};

const approveCenter = async (req, res) => {
  try {
    const { schemeName, state } = req.body;
    const centerId = req.params.id;
    const response = await centerService.approveCenter(
      centerId,
      schemeName,
      state
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Center approved",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot approve centers",
    });
  }
};

const getAllApprovedCentersByScheme = async (req, res) => {
  try {
    const { trainingPartnerId, schemeName, state } = req.query;
    const response = await centerService.getAllCentersByApproveSchems(
      trainingPartnerId,
      schemeName,
      state
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "data fetched sucessfully",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot fetch centers",
    });
  }
};

const updateCenterData = async (req, res) => {
  try {
    const trainingPartnerId = req.trainingPartnerId;
    const centerId = req.params.id;
    const data = req.body;
    const response = await centerService.updateCenterData(
      centerId,
      data,
      trainingPartnerId
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Center updated",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot update center",
    });
  }
};

const getAllCenterBySchemeNameAndState = async (req, res) => {
  try {
    const state = req.query.state;
    const scheme = req.query.scheme;
    if (!state || !scheme) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "please provide state and scheme",
      });
    }

    const response = await centerService.getAllCentersBySchemeName(
      scheme,
      state
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot fetch centers",
    });
  }
};

const getCenterDetails = async (req, res) => {
  try {
    const centerId = req.params.centerId;
    if(!centerId){
      return res.status(StatusCodes.BAD_REQUEST).json({
        success:false,
        message: "Please provide centerId",
      });
    }
    const response = await centerService.getACenterDetails(centerId);
    return res.status(StatusCodes.OK).json({
      message: "Center details fetched",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success:false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export {
  createCenter,
  getAllCentersOfTrainingPartner,
  filterCenterBySchemeAndState,
  approveCenter,
  getAllApprovedCentersByScheme,
  updateCenterData,
  getAllCenterBySchemeNameAndState,
  getCenterDetails
};
