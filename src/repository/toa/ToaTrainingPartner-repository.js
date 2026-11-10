import ToaTrainingPartner from "../../models/toa/ToaTrainingPartner.model.js";

class ToaTrainingPartnerRepository {
  async create(data) {
    return ToaTrainingPartner.create(data);
  }

  async findById(id) {
    return ToaTrainingPartner.findById(id);
  }

  async findByEmail(email) {
    return ToaTrainingPartner.findOne({ email: String(email).toLowerCase().trim() });
  }

  async findByResetTokenHash(hash) {
    return ToaTrainingPartner.findOne({ passwordResetTokenHash: hash, passwordResetExpires: { $gt: new Date() } });
  }

  async list({ status, search } = {}) {
    const query = {};
    if (status) query.status = String(status);
    if (search) {
      const pattern = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ organizationName: pattern }, { email: pattern }, { tpCode: pattern }, { contactPerson: pattern }];
    }
    return ToaTrainingPartner.find(query).sort({ createdAt: -1 });
  }
}

export default ToaTrainingPartnerRepository;
