class CrudRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    try {
      const res = await this.model.create(data);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async update(id, data) {
    try {
      const res = await this.model.findByIdAndUpdate(id, data, {
        new: true,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getById(id) {

    try {
      const res = await this.model.findById(id);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getAll() {
    try {
      const res = await this.model.find();
      return res;
    } catch (error) {
      throw error;
    }
  }

  async destroy(id) {
    try {
      const res = await this.model.findByIdAndDelete(id);
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default CrudRepository;
