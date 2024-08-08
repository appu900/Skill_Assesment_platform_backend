import express from "express";
import {
  generateMonthlyInvoice,
  getInvoicesOfAssesmentAgency,
  getMonthlyInvoice,
  updateAssesmentAgencyPdf,
  updatePaymentStatusOfInvoice,
} from "../../controller/Assesment-agency-invoice-controller.js";
const router = express.Router();

router.post("/:id", generateMonthlyInvoice);
router.post("/monthly/query", getMonthlyInvoice);
router.get("/aa/:id", getInvoicesOfAssesmentAgency);
router.put("/upload/:id", updateAssesmentAgencyPdf);
router.put("/payment/:id", updatePaymentStatusOfInvoice);

export default router;
