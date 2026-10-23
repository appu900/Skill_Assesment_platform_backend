import express from "express";
import {
  createScheme,
  fetchAllSchemeOfSchemeType,
  fetchAllSchems,
} from "../../controller/Scheme-Controller.js";
import { allow, ROLES } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", allow(ROLES.ADMIN), createScheme);
router.get("/", fetchAllSchems);
router.get("/query", fetchAllSchemeOfSchemeType);

export default router;
