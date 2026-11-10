import { StatusCodes } from "http-status-codes";
import CertificateFormatService from "../service/CertificateFormatService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { auditContext } from "../utils/audit.js";
import { sendFile } from "../utils/toa/excel.js";

const formats = new CertificateFormatService();
const ok = (res, data, message = "ok") => res.status(StatusCodes.OK).json({ success: true, data, message });
const pdf = (res, buffer, name) => sendFile(res, buffer, name, "application/pdf");

export const getCertificateFormat = asyncHandler(async (req, res) => ok(res, await formats.get(req.query)));
export const savedCertificateFormats = asyncHandler(async (req, res) => ok(res, await formats.saved()));
export const saveCertificateFormat = asyncHandler(async (req, res) => ok(res, await formats.save(req.query, req.body?.html, req.user.id, auditContext(req)), "format saved"));
export const removeCertificateFormat = asyncHandler(async (req, res) => ok(res, await formats.reset(req.query, auditContext(req)), "format removed"));
export const previewCertificateFormat = asyncHandler(async (req, res) => pdf(res, await formats.preview(req.query, req.body?.html), "certificate-preview.pdf"));

export const certificatePdf = asyncHandler(async (req, res) => {
  const { certificate, pdf: buffer } = await formats.certificatePdf(req.params.id, req.user);
  pdf(res, buffer, `${certificate.Enrolment_number}-certificate.pdf`);
});
export const batchCertificatesPdf = asyncHandler(async (req, res) => {
  const { batch, pdf: buffer } = await formats.batchPdf(req.params.id, req.user);
  pdf(res, buffer, `${batch.ABN_Number ?? "batch"}-certificates.pdf`);
});
