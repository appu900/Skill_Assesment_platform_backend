import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import {
  getCertificateFormat,
  previewCertificateFormat,
  removeCertificateFormat,
  saveCertificateFormat,
  savedCertificateFormats,
} from "../../controller/Certificate-format-controller.js";

// ** certificate formats of the normal TP flow, per training partner and / or scheme (?tp=&scheme=)
const router = express.Router();
router.use(allow(ROLES.ADMIN));
router.get("/", getCertificateFormat);
router.get("/saved", savedCertificateFormats);
router.put("/", saveCertificateFormat);
router.delete("/", removeCertificateFormat);
router.post("/preview", previewCertificateFormat);

export default router;
