import CrudRepository from "./crud.repository.js";
import Sector from "../models/Sector.js";

class SectorRepository extends CrudRepository {
  constructor() {
    super(Sector);
  }

  async getByName(sectorName) {
    try {
      const response = await Sector.findOne({ name: sectorName });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCourseBySector(sectorName){
    try {
      const response = await Sector.findOne({ name: sectorName }).populate("courses");
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default SectorRepository;
