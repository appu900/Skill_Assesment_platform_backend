import { StatusCodes } from "http-status-codes";
import StudentService from "../service/student-service.js";
const studentService = new StudentService();

const createStudent = async (req, res) => {
  try {
    const payload = req.body;
    payload.trainingPartner = req.trainingPartnerId;
    const response = await studentService.createStudent(payload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "student added susessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

export {createStudent}
