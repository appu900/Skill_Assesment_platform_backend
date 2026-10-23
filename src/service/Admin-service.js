import AdminRepository from "../repository/Admin-Repository.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";

class AdminService {
  constructor() {
    this.adminRepository = new AdminRepository();
  }

  // ** only an admin can create another admin, except the very first one (bootstrap)
  async createAdmin(data, user) {
    const adminCount = await this.adminRepository.count();
    if (adminCount > 0 && user?.role !== ROLES.ADMIN) {
      throw AppError.forbidden("Only an admin can create another admin");
    }
    const res = await this.adminRepository.create(data);
    return {
      id: res._id,
      email: res.email,
    };
  }

  async login(data) {
    const { email, password } = data;
    if (!email || !password) {
      throw new AppError("Email and password are required");
    }
    const admin = await this.adminRepository.findByEmail(email);
    // ** same message for unknown email and wrong password, so emails cannot be enumerated
    if (!admin || !admin.comparePassword(password)) {
      throw AppError.unauthorized("Invalid email or password");
    }
    return {
      token: admin.generateJwt(),
      email: admin.email,
      name: admin.name,
    };
  }
}

export default AdminService;
