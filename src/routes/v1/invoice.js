import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  generateMonthlyInvoice,
  getInvoicesOfAssesmentAgency,
  getMonthlyInvoice,
  updateAssesmentAgencyPdf,
  updatePaymentStatusOfInvoice,
} from "../../controller/Assesment-agency-invoice-controller.js";
import { batchInvoicePdf, listBatchInvoices } from "../../controller/Batch-invoice-controller.js";

const router = express.Router();
const { ADMIN, ASSESMENT_AGENCY, TRAINING_PARTNER } = ROLES;

// ** batch payment invoices (issued when a training partner submits a batch)
router.get("/batches", allow(TRAINING_PARTNER, ADMIN), listBatchInvoices);
router.get("/batch/:id/pdf", allow(TRAINING_PARTNER, ADMIN), batchInvoicePdf);

router.post("/monthly/query", allow(ASSESMENT_AGENCY, ADMIN), getMonthlyInvoice);
router.post("/:id", allow(ASSESMENT_AGENCY, ADMIN), generateMonthlyInvoice);
router.get("/aa/:id", allow(ASSESMENT_AGENCY, ADMIN), getInvoicesOfAssesmentAgency);
router.put("/upload/:id", allow(ASSESMENT_AGENCY, ADMIN), updateAssesmentAgencyPdf);
router.put("/payment/:id", allow(ADMIN), updatePaymentStatusOfInvoice);

export default router;
