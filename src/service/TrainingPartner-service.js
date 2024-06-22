import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";

class TrainingPartnerService {
  constructor() {
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  //   ** create trainingPartner
  async createTrainingPartner(data) {
    try {
      const responsePayload = await this.trainingPartnerRepository.create(data);
      return responsePayload;
    } catch (error) {
      throw error;
    }
  }

  // ** login functionality of traingPartner
  async login(email, password) {
    try {
      console.log(email, password, "service layer");
      const trainingPartner = await this.trainingPartnerRepository.findByEmail(
        email
      );
      if (!trainingPartner) {
        throw new Error("user not found with this email");
      }
      if (!trainingPartner.checkPassword(password)) {
        throw new Error("incorrect Password");
      }
      const token = trainingPartner.generateJwt();
      const response = {
        data: trainingPartner,
        token: token,
      };
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** get a trainingPartnerData based on Id
  async getTrainingPartnerById(id) {
    try {
      const res = this.trainingPartnerRepository.get(id);
      return res;
    } catch (error) {
      throw error;
    }
  }

  // ** get all tp data

  async getAllTrainingParterData() {
    try {
      const res = await this.trainingPartnerRepository.getAll();
      return res;
    } catch (error) {
      console.log("error in getting all trainingPartner data", error.message);
      throw error;
    }
  }

  async updateTrainingPartnerDetails(id, data) {
    try {
      const response = await this.trainingPartnerRepository.update(id, data);
      return response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async ApproveApplication(id) {
    try {
      const response =
        await this.trainingPartnerRepository.updateStatusApproved(id);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async rejectApplication(id) {
    try {
      const response =
        await this.trainingPartnerRepository.updateStatusRejected(id);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getNewOnbordedTrainingPartner() {
    try {
      const response =
        await this.trainingPartnerRepository.getNewPendingRequests();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllApprovedTrainingPartner() {
    try {
      const response =
        await this.trainingPartnerRepository.getApprovedApplications();
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default TrainingPartnerService;
  