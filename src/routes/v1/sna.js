import express from "express";
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

router.post("/", createSNA);
router.post("/login", snaLogin);
router.get("/batch/query", getAllGovernmentBatchesStateAndScehmeWise);
router.put("/batch/approve/:id", approveGovernmentSchemeBatches);
router.get("/centers/query", filterCenterBySchemeAndState);
router.put("/center/approve/:id", approveCenter);
router.get("/centers/query", getAllApprovedCentersByScheme);
router.get("/batches/all/query", getAllBatchesBySchemeName);
router.get("/all",getAllSnaDetails)

export default router;
