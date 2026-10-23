import Price from "../models/price.model.js";
import CrudRepository from "./crud.repository.js";

class PriceRepository extends CrudRepository {
  constructor() {
    super(Price);
  }

  async getByScheme(scheme) {
    return Price.findOne({ scheme: String(scheme) });
  }
}

export default PriceRepository;
