import StudentRepository from "../repository/student-repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import ExamRepository from "../repository/Exam-repository.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { omit } from "../utils/fieldFilter.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";

const PROTECTED_FIELDS = [
  "_id",
  "redg_No",
  "markUploadStatus",
  "marks",
  "absent",
  "certificate",
  "DateOfIssueMarksheet",
  "Grade",
  "enrolledBatch",
  "trainingPartner",
  "createdAt",
  "updatedAt",
];

class StudentService {
  constructor() {
    this.studentRepository = new StudentRepository();
    this.batchRepository = new BatchRepository();
    this.examRepository = new ExamRepository();
  }

  async getStudentOrFail(id) {
    const student = await this.studentRepository.get(id);
    if (!student) {
      throw AppError.notFound("Student not found");
    }
    return student;
  }

  async createStudent(data, trainingPartnerId) {
    return this.studentRepository.create({
      ...omit(data, PROTECTED_FIELDS),
      trainingPartner: trainingPartnerId,
    });
  }

  async getStudentByid(id) {
    return this.studentRepository.getStudentDetails(id);
  }

  // ** only the training partner of the student may change the photo, until the batch is submitted
  async uploadProfilePic(id, imageUrl, user) {
    const student = await this.getStudentOrFail(id);
    assertOwnerOrAdmin(student.trainingPartner, user, "This student does not belong to you");
    if (user.role !== ROLES.ADMIN && student.enrolledBatch) {
      const batch = await this.batchRepository.get(student.enrolledBatch);
      if (batch?.batchActivePermission) {
        throw new AppError("batch is already submitted, profile pic cannot be changed");
      }
    }
    return this.studentRepository.updateProfilePic(id, imageUrl);
  }

  // ** absent is marked by the assesment agency of the student's exam (or an admin)
  async updateStudentAsAbsent(studentId, user) {
    const student = await this.getStudentOrFail(studentId);
    if (user.role === ROLES.ASSESMENT_AGENCY) {
      const exam = await this.examRepository.model.findOne({ batchId: student.enrolledBatch });
      assertOwnerOrAdmin(exam?.assesmentAgencyId, user, "This student is not part of your exam");
    }
    student.absent = true;
    await student.save();
    return true;
  }
}

export default StudentService;
