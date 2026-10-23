import { StatusCodes } from "http-status-codes";
import TrainingPartnerService from "../service/TrainingPartner-service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

const tpService = new TrainingPartnerService();

class TrainingPartnerController {
  // ** filter data based on sector, course, scheme and state
  static filterTrainingPartnerData = asyncHandler(async (req, res) => {
    const response = await tpService.getTrainingPartnersAccordingTofilter(req.query);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched successfully",
    });
  });

  //** onBoard TraingPartner application (public)
  static onBoardTrainingPartner = asyncHandler(async (req, res) => {
    const response = await tpService.createTrainingPartner(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "trainingPartner application created",
      data: response,
    });
  });

  static getTrainingPartnerById = asyncHandler(async (req, res) => {
    const trainingPartner = await tpService.getTrainingPartnerById(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "data fetched sucessfully",
      data: trainingPartner,
    });
  });

  static getAllData = asyncHandler(async (req, res) => {
    const response = await tpService.getAllTrainingParterData(getPagination(req.query));
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched successfully",
    });
  });

  static updateTrainingPartnerStatus = asyncHandler(async (req, res) => {
    const response = await tpService.updateTrainingPartnerDetails(req.params.id, req.body, req.user);
    return res.status(StatusCodes.OK).json({
      data: response,
      success: true,
    });
  });

  static updateStatusToApproved = asyncHandler(async (req, res) => {
    const response = await tpService.ApproveApplication(req.params.id, req.body.amount);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "Application approved sucessfully",
    });
  });

  static updateStatusToRejected = asyncHandler(async (req, res) => {
    const response = await tpService.rejectApplication(req.params.id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "Application rejected sucessfully",
    });
  });

  static login = asyncHandler(async (req, res) => {
    const response = await tpService.login(req.body.registeredOfficeEmail, req.body.password);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "login sucessfull",
      data: response,
    });
  });

  static getNewTrainingPartnerApplications = asyncHandler(async (req, res) => {
    const response = await tpService.getNewOnbordedTrainingPartner();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  });

  static getApprovedTrainingPartnerData = asyncHandler(async (req, res) => {
    const response = await tpService.getAllApprovedTrainingPartner();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  });

  static updateEmail = asyncHandler(async (req, res) => {
    await tpService.updateEmail(req.params.id, req.body.email, req.user);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "email updated",
    });
  });

  static updateSector = asyncHandler(async (req, res) => {
    const response = await tpService.updateSector(req.params.id, req.body.sector, req.user);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "new sector added",
      data: response,
    });
  });

  static updateCourses = asyncHandler(async (req, res) => {
    const response = await tpService.updateCourse(req.params.id, req.body.course, req.user);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "new course added",
      data: response,
    });
  });
}

export default TrainingPartnerController;
