import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";
import AssesmentMonthlyRepository from "../repository/AssesmentMonthlyRepo.js";
import ExamRepository from "../repository/Exam-repository.js";

class AssesmentAgencyInvoiceService {
  constructor() {
    this.assesmentInvoiceRepo = new AssesmentMonthlyRepository();
    this.assesmentAgencyRepo = new AssesmentAgencyRepository();
    this.examRepository = new ExamRepository();
  }

  async generateMonthlyInvoice(assesmentAgencyId) {
    try {
      const date = new Date();

      // Convert the date to Indian Standard Time (IST)
      const options = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "long",
        day: "2-digit",
      };
      const localeDateString = date.toLocaleString("en-US", options);

      const [month, day, year] = localeDateString.split(" ");
      const today = `${day}-${month}-${year}`;

      //   ** fetch assesmentAgency to know percentage

      const assesmentAgency = await this.assesmentAgencyRepo.get(
        assesmentAgencyId
      );

      if (!assesmentAgency) {
        throw new Error("Assesment Agency not found");
      }

      const percentage = assesmentAgency.paymentPercentage;

      //   ** check if invoice is already generated for the month and yearci

      const invoice = await this.assesmentInvoiceRepo.getInvoiceFilter(
        assesmentAgencyId,
        month,
        year
      );
      if (invoice) {
        return invoice;
      }

      //   ** get all the exam of the assesmentAgency by month and year which are completed

      const exams = await this.examRepository.filterExamByMonthAndYear(
        assesmentAgencyId,
        month,
        year
      );



      let totalStudents = 0;
      let totalAssessedStudents = 0;

      const examDetails = exams.map((exam) => {
        totalStudents += exam.totalStudents;
        totalAssessedStudents += exam.presentStudents;
        
        return {
          batchAbn: exam.batchABN,
          tpname: exam.TrainingOrganization,
          assessmentDate: exam.assesmentdate,
          totalNoOfCandidates: exam.totalStudents,
          noOfAssessedCandidates: exam.presentStudents,
          costPerCandidate: exam.perStudentCost,
          amountToPaid: (exam.batchPaymentAmount * percentage) / 100,
        };
      });

      let totalAmountToBePaid = 0;
      console.log(examDetails);
      examDetails.forEach((exam) => {
        totalAmountToBePaid += exam.amountToPaid;
      });

      console.log("check",totalAssessedStudents)
      const payload = {
        AssesmentAgencyId: assesmentAgencyId,
        invoiceGenerateDate: today,
        examDetails: examDetails,
        totalNoOfcandidates: totalStudents,
        totalNoOfAssessedCandidates: totalAssessedStudents,
        AssesmentAgencyDetails: {
          name: assesmentAgency.agencyName,
          PAN: assesmentAgency.COMPANY_PAN_NO,
          contactNumber: assesmentAgency.phoneNumber,
          address: assesmentAgency.BRANCH_ADDRESS,
          GST_Number: assesmentAgency.COMPANY_GST_NO,
        },
        BankInformation: {
          accountNumber: assesmentAgency.AccountNumber,
          bankName: assesmentAgency.BankName,
          branchName: assesmentAgency.BranchName,
          IFSCCode: assesmentAgency.IFSC_Code,
        },
        totalAmountToBePaid:totalAmountToBePaid,
        month: month,
        year: year,
      };

      const response = await this.assesmentInvoiceRepo.create(payload);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default AssesmentAgencyInvoiceService;
