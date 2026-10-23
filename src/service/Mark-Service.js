import ExamRepository from "../repository/Exam-repository.js";
import MarkRepository from "../repository/Mark-repository.js";
import StudentRepository from "../repository/student-repository.js";
import AppError from "../utils/AppError.js";
import { assertOwnerOrAdmin, isSameId } from "../utils/ownership.js";

class MarkService {
  constructor() {
    this.markRepository = new MarkRepository();
    this.studentRepository = new StudentRepository();
    this.examRepository = new ExamRepository();
  }

  // ** marks are uploaded by the assesment agency of the exam, identity fields come from the database
  async create(data, user) {
    const exam = await this.examRepository.get(data.examId);
    if (!exam) {
      throw AppError.notFound("exam not found");
    }
    assertOwnerOrAdmin(exam.assesmentAgencyId, user, "This exam is not assigned to you");

    const student = await this.studentRepository.get(data.studentId);
    if (!student) {
      throw AppError.notFound("student details not found");
    }
    if (!isSameId(student.enrolledBatch, exam.batchId)) {
      throw new AppError("student does not belong to the batch of this exam");
    }

    const existingMark = await this.markRepository.getMarkByExamAndStudent(exam._id, student._id);
    if (student.markUploadStatus === true || existingMark) {
      throw AppError.conflict("Mark already uploaded for this student");
    }

    const mark = await this.markRepository.create({
      ...data,
      examId: exam._id,
      batchId: exam.batchId,
      batchABN: exam.batchABN,
      courseName: exam.course,
      sectorName: exam.sector,
      centerCode: exam.CenterCode || data.centerCode,
      TrainingPartner: exam.TrainingOrganization,
      AssesmentAgencyName: exam.assesmentAgency,
      studentId: student._id,
      studentName: student.name,
      studentRedgNo: student.redg_No,
      studentProfilePic: student.profilepic,
      MPR_ID: student.MPR_Id,
    });

    student.marks = mark._id;
    student.markUploadStatus = true;
    student.Grade = mark.Grade;
    await student.save();
    return mark;
  }

  async getIndividualStudentMarks(studentId) {
    return this.markRepository.getMarkByStudentId(studentId);
  }

  async getStudentMarksByBatchId(batchId) {
    return this.markRepository.getStudentMarksByBatchId(batchId);
  }

  async getAllAttendanceSheetDetails(examId) {
    return this.examRepository.get(examId);
  }

  async getGroupMarksData(batchId) {
    const marks = await this.markRepository.getStudentMarksByBatchId(batchId);
    const exam = await this.examRepository.findExamByBatchId(batchId);
    if (!exam) {
      throw AppError.notFound("no exam found for this batch");
    }

    const examDetails = {
      assessmentAgencyName: exam.assesmentAgency,
      trainingPartnerName: exam.TrainingOrganization,
      centerName: exam.batchId?.centerName,
      centerId: exam.CenterCode,
      batchABN: exam.batchId?.ABN_Number,
      sector: exam.sector,
      courseName: exam.course,
      courseCode: exam.courseCode,
      examDate: exam.assesmentdate,
      assesorId: exam.AssessorId?.assesoraId,
      assesorName: exam.AssessorId?.name,
      assesorQualification: exam.AssessorId?.education_qualification_3,
      assesorContactNumber: exam.AssessorId?.phoneNumber,
      presentStudent: exam.presentStudents,
      totalStudents: exam.batchId?.students?.length || 0,
      assesmentAgencyLogo: exam.assesmentAgencyId?.logo,
    };
    return {
      examDetails,
      marks,
    };
  }
}

export default MarkService;
