import upload from "../config/s3-imageUpload-config.js";
import SchemeService from "../service/SchemeService.js";
import { StatusCodes } from "http-status-codes";

const schemeService = new SchemeService();
const singleFileUploader = upload.single("image")

const createScheme = async (req, res) => {
  singleFileUploader(req,res,async function(err) {
    
    if(err){
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error:err.message,
        message:"Something went wrong"
      })
    }
 
  try {
    const paylaod = req.body;
    const imageUrl = req.file?.location;
    paylaod.logo = imageUrl;
    const response = await schemeService.create(paylaod);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "Scheme created successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
})
};

const fetchAllSchems = async (req, res) => {
  try {
    const response = await schemeService.getAllSchems();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "All Schemes fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

const fetchAllSchemeOfSchemeType = async (req, res) => {
  try {
    const response = await schemeService.getSchemeBySchemeType(
      req.query.schemeType
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "All Schemes fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
      message: "something went wrong",
    });
  }
};

export { createScheme, fetchAllSchems,fetchAllSchemeOfSchemeType };
