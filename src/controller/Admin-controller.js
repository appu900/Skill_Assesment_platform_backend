import AdminService from "../service/Admin-service.js";
import { adminAuthSchema } from "../validator/AdminAuthValidator.js";
import vine,{errors} from "@vinejs/vine";
const adminService = new AdminService();

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

  
}

export default AdminController;
