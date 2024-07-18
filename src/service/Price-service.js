import PriceRepository from "../repository/priceRepository.js";

class PriceService {
  constructor() {
    this.priceRepository = new PriceRepository();
  }

  async createPrice(data) {
    try {
      const res = await this.priceRepository.create(data);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getPriceDetails(schemeName) {
    try {
      const response = await this.priceRepository.getByScheme(schemeName);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default PriceService;
