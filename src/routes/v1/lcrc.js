import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import { loginLimiter } from "../../middleware/rateLimiter.js";
import {
  approveCorporateBatch,
  approveCorporateCenter,
  approveResult,
  changeLcrcPassword,
  createLcrc,
  getAllLcrc,
  getCorporateBatches,
  getLcrcProfile,
  getPendingCorporateCenters,
  getResultsForReview,
  lcrcLogin,
  rejectCorporateBatch,
  rejectCorporateCenter,
  rejectResult,
  resetLcrcPassword,
  updateLcrc,
} from "../../controller/Lcrc-controller.js";

const router = express.Router();
const { ADMIN, LCRC } = ROLES;

router.post("/login", loginLimiter, lcrcLogin);

// ** admin manages LC/RC accounts; the password is generated and emailed
router.post("/", allow(ADMIN), createLcrc);
router.get("/all", allow(ADMIN), getAllLcrc);
router.put("/:id/reset-password", allow(ADMIN), resetLcrcPassword);

// ** own account
router.get("/me", allow(LCRC), getLcrcProfile);
router.put("/me/password", allow(LCRC), changeLcrcPassword);

// ** corporate approvals: what the admin / SNA do for government schemes
router.get("/centers/pending", allow(LCRC, ADMIN), getPendingCorporateCenters);
router.put("/center/approve/:id", allow(LCRC, ADMIN), approveCorporateCenter);
router.put("/center/reject/:id", allow(LCRC, ADMIN), rejectCorporateCenter);
router.get("/batches", allow(LCRC, ADMIN), getCorporateBatches);
router.put("/batch/approve/:id", allow(LCRC, ADMIN), approveCorporateBatch);
router.put("/batch/reject/:id", allow(LCRC, ADMIN), rejectCorporateBatch);

// ** results: LC/RC for corporate batches, admin for all
router.get("/results", allow(LCRC, ADMIN), getResultsForReview);
router.put("/result/approve/:id", allow(LCRC, ADMIN), approveResult);
router.put("/result/reject/:id", allow(LCRC, ADMIN), rejectResult);

// ** declared last so it does not catch /me, /all etc.
router.put("/:id", allow(ADMIN), updateLcrc);

export default router;
