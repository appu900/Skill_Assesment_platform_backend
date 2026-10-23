import { StatusCodes } from "http-status-codes";
import CourseService from "../service/CourseService.js";
import asyncHandler from "../utils/asyncHandler.js";

const courseService = new CourseService();

const createCourse = asyncHandler(async (req, res) => {
  const response = await courseService.create(req.body);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "course created",
    data: response,
  });
});

const getAllCourses = asyncHandler(async (req, res) => {
  const response = await courseService.getAllCourses();
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "All courses fetched",
    data: response,
  });
});

export { createCourse, getAllCourses };
