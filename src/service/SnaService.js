import SnaRepository from "../repository/SnaRepository.js";

class SnaService {
  constructor() {
    this.snaRepository = new SnaRepository();
  }

  async create(data) {
    try {
      const response = await this.snaRepository.create(data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async login(email, password, scheme) {
    try {
      const sna = await this.snaRepository.findByEmail(email);
      if (!sna) {
        throw new Error("User not found");
      }
      if (!sna.checkPassword(password)) {
        throw new Error("Incorrect password");
      }
      if (sna.scheme !== scheme) {
        throw new Error("unAuthorized login");
      }
      const token = sna.generateJwt();
      sna.password = null;
      const response = {
        data: sna,
        token: token,
      };
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllSna() {
    try {
      const response = await this.snaRepository.getAll();
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default SnaService;
