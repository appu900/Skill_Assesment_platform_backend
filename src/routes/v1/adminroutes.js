import express from 'express';
import AdminController from '../../controller/Admin-controller.js';

const router = express.Router();


router.post("/", AdminController.createNewAdmin);
router.post("/login", AdminController.login);
router.post("/notification",AdminController.createNewNotification)
router.get("/notifications",AdminController.getAllNotifications)

export default router;