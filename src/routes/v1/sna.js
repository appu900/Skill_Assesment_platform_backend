import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import { loginLimiter } from "../../middleware/rateLimiter.js";
import {
  getAllBatchesBySchemeName,
  getAllGovernmentBatchesStateAndScehmeWise,
} from "../../controller/Batch-controller.js";
import {
  approveCenter,
  filterCenterBySchemeAndState,
  getAllApprovedCentersByScheme,
} from "../../controller/CenterController.js";
import {
  approveGovernmentSchemeBatches,
  createSNA,
  getAllSnaDetails,
  snaLogin,
} from "../../controller/SnaController.js";

const router = express.Router();
const { ADMIN, SNA } = ROLES;

router.post("/login", loginLimiter, snaLogin);

// ** admin creates and lists SNA accounts
router.post("/", allow(ADMIN), createSNA);
router.get("/all", allow(ADMIN), getAllSnaDetails);

// ** SNA (scoped to its own state and scheme) or admin
router.get("/batch/query", allow(SNA, ADMIN), getAllGovernmentBatchesStateAndScehmeWise);
router.put("/batch/approve/:id", allow(SNA, ADMIN), approveGovernmentSchemeBatches);
router.get("/centers/query", allow(SNA, ADMIN), filterCenterBySchemeAndState);
router.put("/center/approve/:id", allow(SNA, ADMIN), approveCenter);
router.get("/batches/all/query", allow(SNA, ADMIN), getAllBatchesBySchemeName);

// ** training partners read their approved centers here
router.get("/centers/tp/query", allow(), getAllApprovedCentersByScheme);

export default router;
