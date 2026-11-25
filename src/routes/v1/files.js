import express from "express";
import { allow } from "../../middleware/auth.js";
import { viewFile } from "../../controller/File-controller.js";

const router = express.Router();

// ** any logged in user of the skill portal (stored keys are random, so a link is only known to those shown the record)
router.get("/view", allow(), viewFile);

export default router;
