import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";

class AssesmentAgencyService {
  constructor() {
    this.assesmentAgencyRepo = new AssesmentAgencyRepository();
  }

  async createAgency(data) {
    try {
      const response = await this.assesmentAgencyRepo.create(data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      console.log(email, password);
      const user = await this.assesmentAgencyRepo.findUserByEmail(email);
      console.log(user);
      if (!user) {
        throw new Error("user not found with this email");
      }

      if (!user.checkPassword(password)) {
        throw new Error("incorrect password");
      }

      const token = user.generateJwt();
      user.password = null;
      const response = {
        data: user,
        token: token,
      };
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateStatusToApproved(id) {
    try {
      if (!id) {
        throw new Error("plaese input the correct parameter");
      }
      const agency = await this.assesmentAgencyRepo.get(id);
      if (!agency) {
        throw new Error("id is wrong");
      }
      const response = await this.assesmentAgencyRepo.updateStatusApproved(id);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateStatusToRejected(id) {
    try {
      if (!id) {
        throw new Error("plaese input the correct parameter");
      }
      const agency = await this.assesmentAgencyRepo.get(id);
      if (!agency) {
        throw new Error("id is wrong");
      }
      const response = await this.assesmentAgencyRepo.updateStatusRejected(id);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAssesmentAgencyById(assesmentId) {
    try {
      const response = await this.assesmentAgencyRepo.get(assesmentId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllAssesmentAgency() {
    try {
      const res = await this.assesmentAgencyRepo.getAll();
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getAllPendingAssesmentAgencyApplocations() {
    try {
      const response =
        await this.assesmentAgencyRepo.getAllPendingApplications();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllApprovedAssesmentAgency() {
    try {
      const response =
        await this.assesmentAgencyRepo.getAllApprovedApplications();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async fiterData(query) {
    try {
      const { sector, state, course } = query;
      const queryObject = {};
      if (sector) {
        queryObject.sectors = { $in: [sector] };
      }
      if (state) {
        queryObject.state_Under_geographicalRegion = state;
      }
      if (course) {
        queryObject.courses = { $in: [course] };
      }

      const response = await this.assesmentAgencyRepo.filterData(queryObject);
      return response;
    } catch (error) {}
  }
}

export default AssesmentAgencyService;
