import CrudRepository from "./crud.repository.js";
import Sector from "../models/Sector.js";

class SectorRepository extends CrudRepository {
  constructor() {
    super(Sector);
  }

  async getByName(sectorName) {
    return Sector.findOne({ name: String(sectorName) });
  }

  async getCourseBySector(sectorName) {
    return Sector.find({ name: String(sectorName) }).populate("courses");
  }
}

export default SectorRepository;
