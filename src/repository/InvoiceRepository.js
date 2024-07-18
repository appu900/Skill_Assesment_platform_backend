import Invoice from "../models/invoice.model.js";
import CrudRepository from "./crud.repository.js";

class InvoiceRepository extends CrudRepository {
  constructor() {
    super(Invoice);
  }
}


export default InvoiceRepository;