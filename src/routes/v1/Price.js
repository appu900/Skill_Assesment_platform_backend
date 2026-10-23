import express from "express";
import { createPrice } from "../../controller/PriceController.js";
import { allow, ROLES } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", allow(ROLES.ADMIN), createPrice);

export default router;
