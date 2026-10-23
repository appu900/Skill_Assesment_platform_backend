import { applyPagination } from "../utils/pagination.js";

class CrudRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async get(id) {
    return this.model.findById(id);
  }

  async destroy(id) {
    return this.model.findByIdAndDelete(id);
  }

  async getAll(pagination = null) {
    return applyPagination(this.model.find().sort({ _id: -1 }), pagination);
  }
}

export default CrudRepository;
