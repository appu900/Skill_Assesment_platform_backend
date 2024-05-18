import AdminRepository from "../repository/Admin-Repository.js";

class AdminService {
  constructor() {
    this.adminRepository = new AdminRepository();
  }

  async createAdmin(data) {
    try {
      const res = await this.adminRepository.create(data);
      const formattedResponse = {
        id: res._id,
        email: res.email,
      };
      return formattedResponse;
    } catch (error) {
      throw error;
    }
  }

  async login(data) {
    try {
      const { email, password } = data;
      const admin = await this.adminRepository.findByEmail(email);
      if (!admin) {
        throw new Error("Admin not found");
      }
      if (!admin.comparePassword(password)) {
        throw new Error("Incorrect Password");
      }
      const token = admin.generateJwt();
      const response = {
        token: token,
        data: admin,
      };
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default AdminService;
