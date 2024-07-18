import Price from "../models/price.model.js";
import CrudRepository from "./crud.repository.js";

class PriceRepository extends CrudRepository {
  constructor() {
    super(Price);
  }

  async getByScheme(scheme) {
    try {
      const response = await Price.findOne({ scheme: scheme });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default PriceRepository;
