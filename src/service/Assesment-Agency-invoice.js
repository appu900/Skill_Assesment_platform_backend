import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";
import AssesmentMonthlyRepository from "../repository/AssesmentMonthlyRepo.js";
import ExamRepository from "../repository/Exam-repository.js";
import AppError from "../utils/AppError.js";
import getMonthName, { monthNames } from "../utils/getMonthName.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";

// ** current day / month name / year in Indian Standard Time
const getTodayInIST = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return { day: get("day"), month: get("month"), year: get("year") };
};

// ** accepts "March", "3" or 3 and returns "March"
const normalizeMonth = (month) => {
  if (monthNames.includes(month)) {
    return month;
  }
  return getMonthName(month);
};

class AssesmentAgencyInvoiceService {
  constructor() {
    this.assesmentInvoiceRepo = new AssesmentMonthlyRepository();
    this.assesmentAgencyRepo = new AssesmentAgencyRepository();
    this.examRepository = new ExamRepository();
  }

  // ** agency share = per student cost * assessed students * percentage / 100
  calculateTotalAmount(perstudentCost, totalStudents, percentage) {
    return ((perstudentCost || 0) * (totalStudents || 0) * (percentage || 0)) / 100;
  }

  // ** generate (or refresh) the invoice of a month, defaults to the current month
  async generateMonthlyInvoice(assesmentAgencyId, period = {}, user) {
    assertOwnerOrAdmin(assesmentAgencyId, user);

    const today = getTodayInIST();
    const month = period.month ? normalizeMonth(period.month) : today.month;
    const year = period.year ? String(period.year) : today.year;
    if (!month || !/^\d{4}$/.test(year)) {
      throw new AppError("Invalid month or year");
    }

    const assesmentAgency = await this.assesmentAgencyRepo.get(assesmentAgencyId);
    if (!assesmentAgency) {
      throw AppError.notFound("Assesment Agency not found");
    }
    if (!assesmentAgency.AccountNumber) {
      throw new AppError("please provide Bank Account Details");
    }

    const invoice = await this.assesmentInvoiceRepo.getInvoiceFilter(assesmentAgencyId, month, year);
    if (invoice?.paymentStatus) {
      throw AppError.conflict("Invoice for this month is already paid and cannot be regenerated");
    }

    const percentage = assesmentAgency.paymentPercentage;
    const exams = await this.examRepository.filterExamByMonthAndYear(assesmentAgencyId, month, year);

    let totalStudents = 0;
    let totalAssessedStudents = 0;
    let totalAmountToBePaid = 0;

    const examDetails = exams.map((exam) => {
      const assessed = exam.presentStudents || 0;
      const amountToPaid = this.calculateTotalAmount(exam.perStudentCost, assessed, percentage);
      totalStudents += exam.totalStudents || 0;
      totalAssessedStudents += assessed;
      totalAmountToBePaid += amountToPaid;
      return {
        examId: exam._id,
        batchAbn: exam.batchABN,
        tpname: exam.TrainingOrganization,
        assesmentDate: exam.assesmentdate,
        totalNoOfCandidates: exam.totalStudents,
        noOfAssessedCandidates: assessed,
        costPerCandidate: exam.perStudentCost,
        amountToPaid,
      };
    });

    const payload = {
      AssesmentAgencyId: assesmentAgencyId,
      Paymentpercentage: percentage,
      invoiceGenerateDate: `${today.day}-${today.month}-${today.year}`,
      examDetails,
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
      totalAmountToBePaid,
      month,
      year,
    };

    if (invoice) {
      return this.assesmentInvoiceRepo.updateInvoiceById(invoice.id, payload);
    }
    return this.assesmentInvoiceRepo.create(payload);
  }

  async getInvoiecByMonthAndYearAndAgencyId(assesmentAgencyId, month, year, user) {
    if (!assesmentAgencyId || !month || !year) {
      throw new AppError("Invalid input");
    }
    assertOwnerOrAdmin(assesmentAgencyId, user);
    return this.assesmentInvoiceRepo.getInvoiceFilter(
      assesmentAgencyId,
      normalizeMonth(month) || month,
      year
    );
  }

  async getALlInvoiceOfAAssesmentAgency(assesmentAgencyId, user) {
    assertOwnerOrAdmin(assesmentAgencyId, user);
    return this.assesmentInvoiceRepo.getInvoiceOFAAssesmentAgency(assesmentAgencyId);
  }

  async updateInvoicePdf(invoiceId, pdfUrl, user) {
    const invoice = await this.assesmentInvoiceRepo.get(invoiceId);
    if (!invoice) {
      throw AppError.notFound("invoice not found");
    }
    assertOwnerOrAdmin(invoice.AssesmentAgencyId, user);
    return this.assesmentInvoiceRepo.updateInvoicePdf(invoiceId, pdfUrl);
  }

  async updateInvoicePaymentStatusOfAA(invoiceId, transactionId, amount) {
    if (!transactionId) {
      throw new AppError("transactionId is required");
    }
    const response = await this.assesmentInvoiceRepo.updateInvoicePaymentStatus(
      invoiceId,
      String(transactionId),
      Number(amount) || 0
    );
    if (!response) {
      throw AppError.notFound("invoice not found");
    }

    // ** mark every exam of this invoice as paid
    const examIds = response.examDetails.map((exam) => exam.examId);
    await this.examRepository.updateManyPaymentStatus(examIds);
    return true;
  }
}

export default AssesmentAgencyInvoiceService;
