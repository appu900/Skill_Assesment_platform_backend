import express from "express";
import { createCourse, getAllCourses } from "../../controller/course-controller.js";
import { allow, ROLES } from "../../middleware/auth.js";

const router = express.Router();

router.post("/course", allow(ROLES.ADMIN), createCourse);
router.get("/course", getAllCourses);

export default router;
