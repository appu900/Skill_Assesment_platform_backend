import CourseService from "../service/CourseService.js";

const courseService = new CourseService();

const createCourse = async (req, res) => {
  try {
    const response = await courseService.create(req.body);
    return res.status(201).json({
      success: true,
      message: "course created",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "internal Server error",
    });  
  }
};

// ** get all course
const getAllCourses = async (req, res) => {
  try {
    const response = await courseService.getAllCourses();
    return res.status(200).json({
      success: true,
      message: "All courses fetched",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "internal Server error",
    });
  }
};

export { createCourse,getAllCourses };
