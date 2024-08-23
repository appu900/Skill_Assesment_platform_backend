import { StatusCodes } from "http-status-codes";
import AdminService from "../service/Admin-service.js";
import NotificationService from "../service/NotificationService.js";
import { adminAuthSchema } from "../validator/AdminAuthValidator.js";
import vine, { errors } from "@vinejs/vine";
const adminService = new AdminService();
const notificationService = new NotificationService();
import upload from "../config/s3-imageUpload-config.js";

const singleFileUploader = upload.single("pdf");

class AdminController {
  static async createNewAdmin(req, res) {
    try {
      //** validate the request data */
      const validator = vine.compile(adminAuthSchema);
      const payload = await validator.validate(req.body);
      const response = await adminService.createAdmin(payload);
      return res.status(201).json({
        sucess: true,
        data: response,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({
          error: error.messages,
        });
      }
      return res.status(500).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async login(req, res) {
    try {
      const response = await adminService.login(req.body);
      return res.status(200).json({
        success: true,
        data: response.token,
      });
    } catch (error) {
      return res.status(500).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async createNewNotification(req, res) {
    singleFileUploader(req, res, async function (err) {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: error.message,
          message: "Something went Wrong",
        });
      }
    });
    try {
      let payload = req.body;
      const imageUrl = req.file?.location;
      payload.pdf = imageUrl;
      const result = await notificationService.createNotification(payload);
      return res.status(StatusCodes.CREATED).json({
        ok: true,
        message: "Notification created Sucessfully",
        data: result,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "SomethinG Went Wrong in Creating Notification",
        error: error.message,
      });
    }
  }

  static async getAllNotifications(req, res) {
    try {
      const response = await notificationService.getAllNotifications();
      return res.status(StatusCodes.OK).json({
        ok: true,
        data: response,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        ok: false,
        error: error.message,
      });
    }
  }
}

export default AdminController;
