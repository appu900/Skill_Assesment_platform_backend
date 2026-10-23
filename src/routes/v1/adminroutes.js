import express from "express";
import AdminController from "../../controller/Admin-controller.js";
import { allow, optionalAuthenticate, ROLES } from "../../middleware/auth.js";
import { loginLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// ** the first admin can be created without a token, every next one needs an admin token
router.post("/", optionalAuthenticate, AdminController.createNewAdmin);
router.post("/login", loginLimiter, AdminController.login);
router.post("/notification", allow(ROLES.ADMIN), AdminController.createNewNotification);
router.get("/notifications", AdminController.getAllNotifications);

export default router;
