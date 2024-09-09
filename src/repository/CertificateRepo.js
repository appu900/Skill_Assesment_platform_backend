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

  async create(data){
    try {
      const response = await StudentCertificate.create(data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async get(studentId){
    try {
       const response  = await StudentCertificate.findOne({studentId});
       return response;
    } catch (error) {
      throw error;
    }
  }
}


export default CerrificateRepository;
