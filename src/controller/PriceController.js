import { StatusCodes } from "http-status-codes";
import PriceService from "../service/Price-service.js";

const priceService = new PriceService();

const createPrice = async (req, res) => {
  try {
    const response = await priceService.createPrice(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Price created",
      data: response,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "Cannot create price",
    });
  }
};

export { createPrice };
