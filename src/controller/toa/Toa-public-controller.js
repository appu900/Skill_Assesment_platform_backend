import { StatusCodes } from "http-status-codes";
import ToaResultService from "../../service/toa/ToaResultService.js";
import ToaPaymentService from "../../service/toa/ToaPaymentService.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { auditContext } from "../../utils/audit.js";

const results = new ToaResultService();
const payments = new ToaPaymentService();

// ** anyone can check a certificate from its QR code or number
export const verifyCertificate = asyncHandler(async (req, res) => res.status(StatusCodes.OK).json({ success: true, data: await results.verify(req.params.code) }));

// ** gateway → server; authenticated by the webhook signature only
export const paymentWebhook = asyncHandler(async (req, res) => {
  const data = await payments.webhook(req.rawBody, req.headers["x-razorpay-signature"], { ...auditContext(req), actorRole: "PaymentGateway" });
  res.status(StatusCodes.OK).json({ success: true, data });
});
