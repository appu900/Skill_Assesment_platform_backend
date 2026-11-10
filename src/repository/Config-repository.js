import Config from "../models/Config.model.js";

class ConfigRepository {
  async findByKey(key) {
    return Config.find({ key }).lean();
  }

  async findAll() {
    return Config.find({}).sort({ key: 1, target: 1 }).lean();
  }

  async findById(id) {
    return Config.findById(id).lean();
  }

  // ** one document per key + scope; saving again replaces the value and bumps the version
  async upsert({ key, target, scope, schemeType, scheme, trainingPartnerId, value, updatedBy }) {
    return Config.findOneAndUpdate(
      { key, target },
      {
        $set: { scope, schemeType, scheme, trainingPartnerId, value, updatedBy },
        $inc: { version: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  }

  // ** used by the startup seed: never overwrites a value someone already edited
  async insertIfMissing(doc) {
    return Config.updateOne({ key: doc.key, target: doc.target }, { $setOnInsert: doc }, { upsert: true });
  }

  async deleteById(id) {
    return Config.findByIdAndDelete(id).lean();
  }
}

export default ConfigRepository;
