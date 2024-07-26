import StudentCertificate from "../models/Certificate.js";
class CerrificateRepository {
  async getAll(batchId) {
    try {
      const response = await StudentCertificate.find({ batchId: batchId });
      return response;
    } catch (error) {
      throw error;
    }
  }
}


export default CerrificateRepository;
