import { StatusCodes } from "http-status-codes";
import vine from "@vinejs/vine";
import AdminService from "../service/Admin-service.js";
import NotificationService from "../service/NotificationService.js";
import { adminAuthSchema } from "../validator/AdminAuthValidator.js";
import upload from "../config/s3-imageUpload-config.js";
import asyncHandler from "../utils/asyncHandler.js";
import runUpload from "../utils/runUpload.js";

const adminService = new AdminService();
const notificationService = new NotificationService();
const singleFileUploader = upload.single("pdf");
const adminValidator = vine.compile(adminAuthSchema);

class AdminController {
  static createNewAdmin = asyncHandler(async (req, res) => {
    const payload = await adminValidator.validate(req.body);
    const response = await adminService.createAdmin(payload, req.user);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: response,
    });
  });

  static login = asyncHandler(async (req, res) => {
    const response = await adminService.login(req.body);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
    });
  });

  static createNewNotification = asyncHandler(async (req, res) => {
    await runUpload(singleFileUploader, req, res);
    const payload = { ...req.body, pdf: req.file?.location };
    const result = await notificationService.createNotification(payload);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Notification created Sucessfully",
      data: result,
    });
  });

  static getAllNotifications = asyncHandler(async (req, res) => {
    const response = await notificationService.getAllNotifications();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: response,
    });
  });
}

export default AdminController;
