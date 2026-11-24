import { StatusCodes } from "http-status-codes";
import InvoiceService from "../service/InvoiceService.js";
import asyncHandler from "../utils/asyncHandler.js";

const invoices = new InvoiceService();

// ** batch payment invoices: a training partner sees its own, the admin every one
export const listBatchInvoices = asyncHandler(async (req, res) => {
  const data = await invoices.list(req.user, req.query);
  res.status(StatusCodes.OK).json({ success: true, data, message: "invoices fetched" });
});

export const batchInvoicePdf = asyncHandler(async (req, res) => {
  const { invoice, pdf } = await invoices.pdf(req.params.id, req.user);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(pdf);
});
