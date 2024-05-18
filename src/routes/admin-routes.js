import express from "express";

import AdminController from "../controller/Admin-controller.js";

const router = express.Router();

router.post("/admin", AdminController.createNewAdmin);

export default router;
