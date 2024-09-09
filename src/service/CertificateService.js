import CerrificateRepository from "../repository/CertificateRepo.js";

class CertificateService {
  constructor() {
    this.certificaterepo = new CerrificateRepository();
  }

  async getAllCertificates(batchId) {
    try {
      const response = await this.certificaterepo.getAll(batchId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getASpecificStudnetCertificate(studentId) {
    try {
      const res = await this.certificaterepo.get(studentId);
      return res;
    } catch (error) {
      throw error;
    }
  }
}

export default CertificateService;
