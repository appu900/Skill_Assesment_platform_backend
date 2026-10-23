import { StatusCodes } from "http-status-codes";
import SectorService from "../service/Sector-Service.js";
import asyncHandler from "../utils/asyncHandler.js";

const sectorService = new SectorService();

const createSector = asyncHandler(async (req, res) => {
  const response = await sectorService.create(req.body);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "sector created",
    data: response,
  });
});

const getAllSector = asyncHandler(async (req, res) => {
  const response = await sectorService.getAllSector();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched sucessfully",
  });
});

const getAllCoursesOfASector = asyncHandler(async (req, res) => {
  const response = await sectorService.getCoursesOfSector(req.query.name);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
  });
});

export { createSector, getAllSector, getAllCoursesOfASector };
