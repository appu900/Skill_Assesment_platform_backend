import { StatusCodes } from "http-status-codes";
import AssesmentAgencyInvoiceService from "../service/Assesment-Agency-invoice.js";
import upload from "../config/s3-imageUpload-config.js";

const assesmentAgencyInvoiceService = new AssesmentAgencyInvoiceService();
const singleuploader = upload.single("pdf");

const generateMonthlyInvoice = async (req, res) => {
  try {
    const assesmentAgencyId = req.params.id;
    const response = await assesmentAgencyInvoiceService.generateMonthlyInvoice(
      assesmentAgencyId
    );
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
      message: "invoice generated successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

const getMonthlyInvoice = async (req, res) => {
  try {
    const assesmentAgencyId = req.body.assesmentAgencyId;
    const month = req.query.month;
    const year = req.query.year;
    if (!month || !year) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "month and year are required",
      });
    }
    const response =
      await assesmentAgencyInvoiceService.getInvoiecByMonthAndYearAndAgencyId(
        assesmentAgencyId,
        month,
        year
      );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

const getInvoicesOfAssesmentAgency = async (req, res) => {
  try {
    const assesmentAgencyId = req.params.id;
    const response =
      await assesmentAgencyInvoiceService.getALlInvoiceOfAAssesmentAgency(
        assesmentAgencyId
      );
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
      message: "data fetched",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

const updateAssesmentAgencyPdf = async (req, res) => {
  try {
      
    singleuploader(req, res, async function (err) {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "file upload failed",
            error: err.message,
            });
        }
        const pdfUrl = req.file?.location;
        console.log(req.file.location)
        if(!pdfUrl){
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "pdf is required",
              });
        }
        const invoiceId = req.params.id;

        const response = await assesmentAgencyInvoiceService.updateInvoicePdf(invoiceId, pdfUrl);

        return res.status(StatusCodes.OK).json({
            success: true,
            data: response,
            message: "pdf uploaded successfully",
        });
    })
   
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }
};

export {
  generateMonthlyInvoice,
  getMonthlyInvoice,
  getInvoicesOfAssesmentAgency,
  updateAssesmentAgencyPdf
};
