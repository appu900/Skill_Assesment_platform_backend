import { StatusCodes } from "http-status-codes";
import AssesmentAgencyInvoiceService from "../service/Assesment-Agency-invoice.js";

const assesmentAgencyInvoiceService = new AssesmentAgencyInvoiceService();

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

export { generateMonthlyInvoice };
