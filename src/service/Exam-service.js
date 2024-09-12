import { createChannel, publishMessage } from "../config/messageQueue.js";
import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";
import BatchRepository from "../repository/Batch-repository.js";
import ExamRepository from "../repository/Exam-repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";
import StudentRepository from "../repository/student-repository.js";
import CerificateRepository from "../repository/CertificateRepo.js";

class ExamService {
  constructor() {
    this.examRepository = new ExamRepository();
    this.batchRepository = new BatchRepository();
    this.assesmentAgencyRepository = new AssesmentAgencyRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
    this.studentRepository = new StudentRepository();
    this.certificateRepository = new CerificateRepository();
  }

  async createExam(courseName, batchId, assesmentAgencyId, trainingPartnerId) {
    try {
      const batch = await this.batchRepository.get(batchId);

      if (!batch) {
        throw new Error("batch not found");
      }

      if (batch.isAssigned) {
        throw new Error("batch is already assigned to an exam");
      }

      const trainingPartner = await this.trainingPartnerRepository.get(
        trainingPartnerId
      );

      if (!trainingPartner) {
        throw new Error("training partner not found");
      }

      const assesmentAgency = await this.assesmentAgencyRepository.get(
        assesmentAgencyId
      );

      if (!assesmentAgency) {
        throw new Error("assesment agency not found");
      }

      const payload = {
        course: courseName,
        sector: batch.sectorName,
        state: batch.state,
        scheme: batch.scheme,
        CenterName: batch.CenterName,
        courseCode: batch.courseCode,
        CenterCode: batch.CenterCode,
        batchId: batch._id,
        assesmentAgencyId: assesmentAgency._id,
        assesmentAgency: assesmentAgency.agencyName,
        TrainingOrganization: trainingPartner.organizationName,
        TrainingPartnerId: trainingPartner._id,
        batchABN: batch.ABN_Number,
        batchPaymentAmount: batch.amountToPaid,
        totalStudents: batch.students.length,
        perStudentCost: batch.perStudentCost,
        courseCredit: batch.courseCredit,
        courseLevel: batch.courseLevel,
      };

      batch.isAssigned = true;
      await batch.save();

      const response = await this.examRepository.create(payload);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getALlExamDetails() {
    try {
      const exams = await this.examRepository.getAllExam();
      return exams;
    } catch (error) {
      throw error;
    }
  }

  async getExamsByAgencyId(testAgencyId) {
    try {
      const exams = await this.examRepository.findAllExamsByTestAgencyId(
        testAgencyId
      );
      return exams;
    } catch (error) {
      throw error;
    }
  }

  async assignAssesor(examId, assesorId) {
    try {
      const exam = await this.examRepository.addAssessorToExam(
        examId,
        assesorId
      );
      const batch = await this.batchRepository.get(exam.batchId);
      batch.assessorId = assesorId;
      await batch.save();
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getAExamDetails(examId) {
    try {
      const exam = await this.examRepository.getAExam(examId);
      return exam;
    } catch (error) {
      throw error;
    }
  }

  async getAttendanceSheet(examId) {
    try {
      const exam = await this.examRepository.getAExam(examId);
      return exam;
    } catch (error) {
      throw error;
    }
  }

  async updateExamStatus(examId, attendanceSheetUrl, resultSheetUrl) {
    try {
      const exam = await this.examRepository.get(examId);
      exam.markUploadAndExamCompleteStatus = true;
      exam.attendanceSheet = attendanceSheetUrl;
      exam.resultSheet = resultSheetUrl;
      await exam.save();
      return exam;
    } catch (error) {
      throw error;
    }
  }

  async uploadMultiplePhotos(examId, imagePayload) {
    try {
      const exam = await this.examRepository.get(examId);
      exam.images = imagePayload;
      await exam.save();
      return exam.images;
    } catch (error) {
      throw error;
    }
  }

  async updatePaymentStatus(examId) {
    try {
      console.log("examId", examId);
      const response = await this.examRepository.updatePaymentStatus(examId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateAssesmentDate(examId, date) {
    try {
      const dateString = date.toString();
      const response = await this.examRepository.updateExamDate(
        examId,
        dateString
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateCandidateAttendanceNumber(examId, attendanceNumber) {
    try {
      const response = await this.examRepository.updateStudentAttendance(
        examId,
        attendanceNumber
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async publishCeritificates(examId) {
    try {
      const exam = await this.examRepository.get(examId);

      if (!exam) {
        throw new Error("exam not found");
      }
      // const channel = await createChannel();

      const batch = await this.batchRepository.get(exam.batchId);
      console.log(batch);
      if (!batch) {
        throw new Error(
          "batch not found contact your bacekd developer something went wrong"
        );
      }
      const studentsData = batch.students;
      studentsData.map(async (std) => {
        // ** to be implemented in message queue infuture DATA.

        // const payload = {
        //   data: {
        //     studentId: student,
        //     batchId: exam.batchId,
        //     examId: examId,
        //     courseName:exam.course,
        //     courseCredit:batch.courseCredit,
        //     courseLevel:batch.courseLevel,
        //     TrainingCenter: batch.centerName,
        //     duration:batch.courseDuration
        //   },
        //   service: "CREATE_CERTIFICATE",
        // };

        // ** SEND MESSAGES TO QUEUE.
        // await publishMessage(
        //   channel,
        //   "CREATE_CERTIFICATE",
        //   JSON.stringify(payload)
        // );

        // ** LOGIC FOR IF SAME SERVER WILL BE USED FOR GENERATING CERTIFICATE.

        const data = {
          studentId: std,
          batchId: exam.batchId,
          examId: examId,
          courseName: exam.course,
          courseCredit: batch.courseCredit,
          courseLevel: batch.courseLevel,
          TrainingCenter: batch.centerName,
          duration: batch.courseDuration,
        };

        // ** fetch students Data

        const student = await this.studentRepository.get(data.studentId);
        console.log("StuddentData",student)
        const certificatePayload = {
          studentName: student.name,
          stutentProfilePic: student.profilepic,
          studentId: student._id,
          batchId: data.batchId,
          fatherName: student.fathername,
          DOB: student.dob,
          Enrolment_number: student.redg_No,
          qualification: data.courseName,
          duration: data.duration,
          credit: data.courseCredit,
          level: data.courseLevel,
          TrainingCenter: data.TrainingCenter,
          District: student.district,
          state: student.state,
          grade: student.Grade,
          placeOfIssue: "Bhubaneswar",
          DateOfIssue: new Date(),
        };
        if (student.absent === false) {
          const certificate = await this.certificateRepository.create(
            certificatePayload
          );
          console.log(certificate);
        }
      });

      // ** update exam status to completed
      exam.certificateIssued = true;
      batch.batchCompletedStatus = true;
      batch.certificateIssued = true;
      batch.status = "Completed";
      await exam.save();
      await batch.save();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

export default ExamService;
