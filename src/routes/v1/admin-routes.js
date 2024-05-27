import express from "express";

import AdminController from "../../controller/Admin-controller.js";

const router = express.Router();

router.post("/admin", AdminController.createNewAdmin);
router.post("/admin/login", AdminController.login);

export default router;


