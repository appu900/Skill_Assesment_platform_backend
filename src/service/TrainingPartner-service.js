import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";

class TrainingPartnerService {
  constructor() {
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  async createTrainingPartner(data) {
    try {
      const result = await this.trainingPartnerRepository.create(data);
      const response = {
        id: result._id,
        email: result.head_owner_email,
      };
      return response;
    } catch (error) {
      throw new Error("Failed to create training partner");
    }
  }

  async login(data) {
    try {
      const { head_owner_email, password } = data;
      if (!head_owner_email || !password) {
        throw new Error("Missing required fields: head_owner_email or password");
      }

      const trainingPartner = await this.trainingPartnerRepository.findByEmail(head_owner_email);

      if (!trainingPartner) {
        throw new Error("Training Partner not found");
      }

      if (!trainingPartner.comparePassword(password)) {
        throw new Error("Incorrect Password");
      }

      const token = trainingPartner.generateToken();
      const response = {
        token: token,
        data: {
          id: trainingPartner._id,
          username: trainingPartner.username,
          head_owner_email: trainingPartner.head_owner_email,
        },
      };
      return response;
    } catch (error) {
      throw new Error("Failed to login");
    }
  }
}

export default TrainingPartnerService;
