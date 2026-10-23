import SnaRepository from "../repository/SnaRepository.js";
import AppError from "../utils/AppError.js";
import { omit } from "../utils/fieldFilter.js";

class SnaService {
  constructor() {
    this.snaRepository = new SnaRepository();
  }

  async create(data) {
    try {
      return await this.snaRepository.create(omit(data, ["_id", "role"]));
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict("SNA already exists with this email");
      }
      throw error;
    }
  }

  async login(email, password, scheme) {
    if (!email || !password) {
      throw new AppError("Email and password are required");
    }
    const sna = await this.snaRepository.findByEmail(email);
    if (!sna || !sna.checkPassword(password)) {
      throw AppError.unauthorized("Invalid email or password");
    }
    if (scheme && sna.scheme !== scheme) {
      throw AppError.unauthorized("unAuthorized login for this scheme");
    }
    return {
      data: sna,
      token: sna.generateJwt(),
    };
  }

  async getAllSna() {
    return this.snaRepository.getAll();
  }
}

export default SnaService;
