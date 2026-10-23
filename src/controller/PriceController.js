import { StatusCodes } from "http-status-codes";
import PriceService from "../service/Price-service.js";
import asyncHandler from "../utils/asyncHandler.js";

const priceService = new PriceService();

const createPrice = asyncHandler(async (req, res) => {
  const response = await priceService.createPrice(req.body);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Price created",
    data: response,
  });
});

export { createPrice };
