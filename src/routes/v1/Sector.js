import express from "express";

import {
  createSector,
  getAllSector,
  getAllCoursesOfASector,
  getAllSectorByAScheme,
} from "../../controller/sectorController.js";

const router = express.Router();

router.post("/", createSector);
router.get("/all", getAllSector);
router.get("/", getAllCoursesOfASector);


export default router;




   

