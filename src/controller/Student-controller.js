import { StatusCodes } from "http-status-codes";
import StudentService from "../service/student-service.js";
import upload from "../config/s3-imageUpload-config.js";
import CertificateService from "../service/CertificateService.js";
const studentService = new StudentService();
const certificateService = new CertificateService();

const singleUploader = upload.single("image");

const createStudent = async (req, res) => {
  try {
    const payload = req.body;
    payload.trainingPartner = req.trainingPartnerId;
    const response = await studentService.createStudent(payload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "student added sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getStudentDetails = async (req, res) => {
  try {
    const studentId = req.params.id;
    const response = await studentService.getStudentByid(studentId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const updateProfilePic = async (req, res) => {
  try {
    singleUploader(req, res, async function (err, data) {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: err.message,
          message: "something went wrong",
        });
      }

      const imageUrl = req.file?.location;
      if (!imageUrl) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "image not uploaded",
        });
      }

      const studentId = req.params.id;

      const response = await studentService.uploadProfilePic(
        studentId,
        imageUrl
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "profile pic uploaded sucessfully",
      });
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const markStudentAbsent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const response = await studentService.updateStudentAsAbsent(studentId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "student marked as absent",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const getStudentCertificateByStudentenrollementId = async(req,res) =>{
  try {
    console.log("controller called")
    const enrollmentNumber = req.body.enrollmentNumber
    console.log(typeof enrollmentNumber);
    if(!enrollmentNumber){
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "enrollment number is required",
      });
    }
    const response = await certificateService.getStudentCertificateByStudentEnrollementId(enrollmentNumber);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched sucessfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "something went wrong with the server",
      message: error.message,
    })
  }
}

export { createStudent, getStudentDetails, updateProfilePic,markStudentAbsent,getStudentCertificateByStudentenrollementId };
