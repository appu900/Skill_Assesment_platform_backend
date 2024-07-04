import { StatusCodes } from "http-status-codes";
import SectorService from "../service/Sector-Service.js";

const sectorService = new SectorService();

const createSector = async (req, res) => {
  try {
    const response = await sectorService.create(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "sector created",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "internal Server error",
    });
  }
};

const getAllSector = async (req, res) => {
  try {
    const response = await sectorService.getAllSector();
    console.log(response)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getAllCoursesOfASector = async (req, res) => {
  try {
    const sectorName = req.query.name;
    const response = await sectorService.getCoursesOfSector(sectorName);
    return res.status(StatusCodes.OK).json({
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

export { createSector, getAllSector,getAllCoursesOfASector };
