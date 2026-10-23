import express from "express";
import {
  createSector,
  getAllSector,
  getAllCoursesOfASector,
} from "../../controller/sectorController.js";
import { allow, ROLES } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", allow(ROLES.ADMIN), createSector);
router.get("/all", getAllSector);
router.get("/", getAllCoursesOfASector);

export default router;
