import AdminRepository from "../repository/Admin-Repository.js";

class AdminService {
  constructor() {
    this.adminRepository = new AdminRepository();
  }

  async createAdmin(data){
    try {
        const res = await this.adminRepository.create(data);
        return res;
    } catch (error) {
        throw error
    }
  }
}

export default AdminService
