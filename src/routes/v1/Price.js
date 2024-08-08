import express from "express";
import { createPrice } from "../../controller/PriceController.js";

const router = express.Router();

router.post("/", createPrice);

export default router;
