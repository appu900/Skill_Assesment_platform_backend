


import express from 'express';
import { createCourse, getAllCourses } from '../../controller/course-controller.js';
const router = express.Router();


router.post("/course", createCourse);
router.get("/course", getAllCourses);

export default router;