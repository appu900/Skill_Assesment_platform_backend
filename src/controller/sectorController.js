import { StatusCodes } from "http-status-codes";
import SectorService from "../service/Sector-Service.js";

const sectorService = new SectorService();

const creareSector = async (req, res) => {
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

export { creareSector };