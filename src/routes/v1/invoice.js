import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  generateMonthlyInvoice,
  getInvoicesOfAssesmentAgency,
  getMonthlyInvoice,
  updateAssesmentAgencyPdf,
  updatePaymentStatusOfInvoice,
} from "../../controller/Assesment-agency-invoice-controller.js";

const router = express.Router();
const { ADMIN, ASSESMENT_AGENCY } = ROLES;

router.post("/monthly/query", allow(ASSESMENT_AGENCY, ADMIN), getMonthlyInvoice);
router.post("/:id", allow(ASSESMENT_AGENCY, ADMIN), generateMonthlyInvoice);
router.get("/aa/:id", allow(ASSESMENT_AGENCY, ADMIN), getInvoicesOfAssesmentAgency);
router.put("/upload/:id", allow(ASSESMENT_AGENCY, ADMIN), updateAssesmentAgencyPdf);
router.put("/payment/:id", allow(ADMIN), updatePaymentStatusOfInvoice);

export default router;
