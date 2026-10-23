import StudentCertificate from "../models/Certificate.js";

class CerrificateRepository {
  async getAll(batchId) {
    return StudentCertificate.find({ batchId: String(batchId) });
  }

  async create(data) {
    return StudentCertificate.create(data);
  }

  async getById(certificateId) {
    return StudentCertificate.findById(certificateId);
  }

  async get(studentId) {
    return StudentCertificate.findOne({ studentId });
  }

  async findByStudentAndBatch(studentId, batchId) {
    return StudentCertificate.findOne({ studentId, batchId: String(batchId) });
  }

  async getCertificateByStudentEnrollmentNumber(enrollmentNumber) {
    return StudentCertificate.findOne({ Enrolment_number: String(enrollmentNumber) });
  }
}

export default CerrificateRepository;
