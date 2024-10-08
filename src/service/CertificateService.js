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

  async getAStudentCertificateByCertificateID(certificateId) {
    try {
      const response = await this.certificaterepo.get(certificateId);
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

  async getStudentCertificateByStudentEnrollementId(enrollmentNumber) {
    try {
      const response =
        await this.certificaterepo.getCertificateByStudentEnrollmentNumber(
          enrollmentNumber
        );
      if (response) {
        return response;
      }
      throw new Error("No certificate found");
    } catch (error) {
      throw error;
    }
  }
}

export default CertificateService;
