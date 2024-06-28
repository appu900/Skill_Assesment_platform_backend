import CrudRepository from "./crud.repository.js";
import Sector from "../models/Sector.js";

class SectorRepository extends CrudRepository {
  constructor() {
    super(Sector);
  }
}

export default SectorRepository;
