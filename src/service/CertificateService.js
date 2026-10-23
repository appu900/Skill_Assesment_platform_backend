import { UnrecoverableError } from "bullmq";
import CerrificateRepository from "../repository/CertificateRepo.js";
import ExamRepository from "../repository/Exam-repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import StudentRepository from "../repository/student-repository.js";
import MarkRepository from "../repository/Mark-repository.js";
import SchemeRepository from "../repository/SchemeRepository.js";
import AppError from "../utils/AppError.js";

const PLACE_OF_ISSUE = "Bhubaneswar";

// ** student fields that are printed on the certificate
const REQUIRED_STUDENT_FIELDS = ["name", "fathername", "dob", "MPR_Id", "district", "state"];

class CertificateService {
  constructor() {
    this.certificaterepo = new CerrificateRepository();
    this.examRepository = new ExamRepository();
    this.batchRepository = new BatchRepository();
    this.studentRepository = new StudentRepository();
    this.markRepository = new MarkRepository();
    this.schemeRepository = new SchemeRepository();
  }

  async getAllCertificates(batchId) {
    return this.certificaterepo.getAll(batchId);
  }

  async getAStudentCertificateByCertificateID(certificateId) {
    return this.certificaterepo.getById(certificateId);
  }

  async getASpecificStudnetCertificate(studentId) {
    return this.certificaterepo.get(studentId);
  }

  async getStudentCertificateByStudentEnrollementId(enrollmentNumber) {
    const response = await this.certificaterepo.getCertificateByStudentEnrollmentNumber(
      enrollmentNumber
    );
    if (!response) {
      throw AppError.notFound("No certificate found");
    }
    return response;
  }

  async getPublishStatus(examId) {
    const exam = await this.examRepository.get(examId);
    if (!exam) {
      throw AppError.notFound("exam not found");
    }
    return {
      examId: exam._id,
      certificateStatus: exam.certificateStatus,
      certificateIssued: exam.certificateIssued,
      certificatesIssuedCount: exam.certificatesIssuedCount,
      certificateError: exam.certificateError,
    };
  }

  async markPublishFailed(examId, message) {
    await this.examRepository.update(examId, {
      certificateStatus: "failed",
      certificateError: message,
    });
  }

  /**
   * ** runs inside the certificate worker (bullmq)
   * issues one certificate per present student who passed, safe to retry:
   * students that already have a certificate for this batch are skipped
   */
  async issueCertificatesForExam(examId, job) {
    const exam = await this.examRepository.get(examId);
    if (!exam) {
      throw new UnrecoverableError("exam not found");
    }
    if (exam.certificateIssued) {
      return { issued: 0, alreadyIssued: true };
    }

    const batch = await this.batchRepository.get(exam.batchId);
    if (!batch) {
      throw new UnrecoverableError("batch of this exam not found");
    }

    const missingBatchFields = ["courseDuration", "courseCredit", "courseLevel", "centerName"].filter(
      (field) => batch[field] === undefined || batch[field] === null || batch[field] === ""
    );
    if (missingBatchFields.length > 0) {
      throw new UnrecoverableError(`batch is missing ${missingBatchFields.join(", ")}`);
    }

    await this.examRepository.update(examId, { certificateStatus: "processing" });

    const scheme = await this.schemeRepository.findBySchemeName(batch.scheme);
    const students = await this.studentRepository.getStudentsByIds(batch.students);
    const marks = await this.markRepository.getAllMarksByExam(examId);
    const markByStudent = new Map(marks.map((mark) => [String(mark.studentId), mark]));

    let issued = 0;
    const skipped = [];

    for (const [index, student] of students.entries()) {
      const mark = markByStudent.get(String(student._id));
      const skip = (reason) => skipped.push({ studentId: student._id, name: student.name, reason });

      if (student.absent || mark?.studentAttendance === false) {
        skip("absent");
      } else if (!mark) {
        skip("marks not uploaded");
      } else if (mark.Result !== "Pass") {
        skip("not passed");
      } else {
        const missingFields = REQUIRED_STUDENT_FIELDS.filter((field) => !student[field]);
        const alreadyIssued = await this.certificaterepo.findByStudentAndBatch(student._id, batch._id);

        if (missingFields.length > 0) {
          skip(`missing ${missingFields.join(", ")}`);
        } else if (!alreadyIssued) {
          await this.certificaterepo.create({
            studentName: student.name,
            stutentProfilePic: student.profilepic,
            studentId: student._id,
            batchId: String(batch._id),
            examId: exam._id,
            fatherName: student.fathername,
            DOB: student.dob,
            Enrolment_number: student.MPR_Id,
            qualification: exam.course,
            duration: batch.courseDuration,
            credit: batch.courseCredit,
            level: batch.courseLevel,
            TrainingCenter: batch.centerName,
            District: student.district,
            state: student.state,
            grade: mark.Grade || student.Grade,
            placeOfIssue: PLACE_OF_ISSUE,
            DateOfIssue: new Date(),
            schemeLogo: scheme?.logo,
            studentRedgNo: student.redg_No,
            schemeType: batch.schemeType,
          });
          await this.studentRepository.addDateOfIssueMarksheet(student._id);
          issued += 1;
        } else {
          issued += 1;
        }
      }

      await job?.updateProgress(Math.round(((index + 1) / students.length) * 100));
    }

    // ** flags are set only after every certificate is written
    await this.examRepository.update(examId, {
      certificateIssued: true,
      certificateStatus: "completed",
      certificatesIssuedCount: issued,
      certificateError: skipped.length > 0 ? `${skipped.length} student(s) skipped` : null,
    });
    batch.batchCompletedStatus = true;
    batch.certificateIssued = true;
    batch.status = "Completed";
    await batch.save();

    return { issued, skipped };
  }
}

export default CertificateService;
