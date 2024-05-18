import AdminService from "../service/Admin-service.js";
const adminService = new AdminService();

class AdminController {
  static async createNewAdmin(req, res) {
    try {
      const response = await adminService.createAdmin(req.body);
      return res.status(201).json({
        sucess: true,
        data: response,
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
