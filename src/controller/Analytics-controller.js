import { StatusCodes } from "http-status-codes";
import AnalyticsService from "../service/AnalyticsService.js";
import asyncHandler from "../utils/asyncHandler.js";

const analyticsService = new AnalyticsService();

const send = (res, data) =>
  res.status(StatusCodes.OK).json({
    success: true,
    data,
    message: "analytics fetched successfully",
  });

// ** every dashboard reads only its own data: the scope always comes from the token, never from the request
const getAdminAnalytics = asyncHandler(async (req, res) => send(res, await analyticsService.admin()));
const getTrainingPartnerAnalytics = asyncHandler(async (req, res) => send(res, await analyticsService.trainingPartner(req.user.id)));
const getSnaAnalytics = asyncHandler(async (req, res) => send(res, await analyticsService.sna(req.user)));
const getLcrcAnalytics = asyncHandler(async (req, res) => send(res, await analyticsService.lcrc()));
const getAgencyAnalytics = asyncHandler(async (req, res) => send(res, await analyticsService.agency(req.user.id)));

export { getAdminAnalytics, getTrainingPartnerAnalytics, getSnaAnalytics, getAgencyAnalytics, getLcrcAnalytics };
