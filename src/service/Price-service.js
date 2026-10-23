import PriceRepository from "../repository/priceRepository.js";

class PriceService {
  constructor() {
    this.priceRepository = new PriceRepository();
  }

  async createPrice(data) {
    return this.priceRepository.create(data);
  }

  async getPriceDetails(schemeName) {
    return this.priceRepository.getByScheme(schemeName);
  }
}

export default PriceService;
