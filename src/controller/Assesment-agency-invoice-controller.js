import { StatusCodes } from "http-status-codes";
import AssesmentAgencyInvoiceService from "../service/Assesment-Agency-invoice.js";
import upload from "../config/s3-imageUpload-config.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";

const assesmentAgencyInvoiceService = new AssesmentAgencyInvoiceService();
const singleuploader = upload.single("pdf");

// ** optional body { month, year } to generate an earlier month, defaults to the current month
const generateMonthlyInvoice = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyInvoiceService.generateMonthlyInvoice(
    req.params.id,
    { month: req.body?.month, year: req.body?.year },
    req.user
  );
  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: response,
    message: "invoice generated successfully",
  });
});

const getMonthlyInvoice = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) {
    throw new AppError("month and year are required");
  }
  // ** an agency always reads its own invoices
  const assesmentAgencyId =
    req.user.role === ROLES.ASSESMENT_AGENCY ? req.user.id : req.body.assesmentAgencyId;
  const response = await assesmentAgencyInvoiceService.getInvoiecByMonthAndYearAndAgencyId(
    assesmentAgencyId,
    month,
    year,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched successfully",
  });
});

const getInvoicesOfAssesmentAgency = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyInvoiceService.getALlInvoiceOfAAssesmentAgency(
    req.params.id,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "data fetched",
  });
});

const updateAssesmentAgencyPdf = asyncHandler(async (req, res) => {
  await runUpload(singleuploader, req, res);
  const pdfUrl = req.file?.location;
  if (!pdfUrl) {
    throw new AppError("pdf is required");
  }
  const response = await assesmentAgencyInvoiceService.updateInvoicePdf(
    req.params.id,
    pdfUrl,
    req.user
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "pdf uploaded successfully",
  });
});

const updatePaymentStatusOfInvoice = asyncHandler(async (req, res) => {
  const response = await assesmentAgencyInvoiceService.updateInvoicePaymentStatusOfAA(
    req.params.id,
    req.body.transactionId,
    req.body.amount
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: response,
    message: "payment status updated",
  });
});

export {
  generateMonthlyInvoice,
  getMonthlyInvoice,
  getInvoicesOfAssesmentAgency,
  updateAssesmentAgencyPdf,
  updatePaymentStatusOfInvoice,
};
