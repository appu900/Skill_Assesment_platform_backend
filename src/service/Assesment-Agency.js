import AssesmentAgencyRepository from "../repository/AssesmentAgency-repository.js";
import sendEmail from "./email-service.js";
import AppError from "../utils/AppError.js";
import { omit } from "../utils/fieldFilter.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";

// ** fields an assesment agency can never set on its own record
const PROTECTED_FIELDS = ["_id", "role", "applicationStatus", "paymentPercentage", "createdAt", "updatedAt"];

class AssesmentAgencyService {
  constructor() {
    this.assesmentAgencyRepo = new AssesmentAgencyRepository();
  }

  async getAgencyOrFail(id) {
    const agency = await this.assesmentAgencyRepo.get(id);
    if (!agency) {
      throw AppError.notFound("Assesment Agency not found");
    }
    return agency;
  }

  async createAgency(data) {
    try {
      return await this.assesmentAgencyRepo.create(omit(data, PROTECTED_FIELDS));
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict("email already exists");
      }
      throw error;
    }
  }

  async login(email, password) {
    if (!email || !password) {
      throw new AppError("Email and password are required");
    }
    const user = await this.assesmentAgencyRepo.findUserByEmail(email);
    if (!user || !user.checkPassword(password)) {
      throw AppError.unauthorized("Invalid email or password");
    }
    return {
      data: user,
      token: user.generateJwt(),
    };
  }

  async updateStatusToApproved(id, percentage) {
    await this.getAgencyOrFail(id);
    const paymentPercentage = Number(percentage);
    if (Number.isNaN(paymentPercentage) || paymentPercentage < 0 || paymentPercentage > 100) {
      throw new AppError("Percentage must be a number between 0 and 100");
    }
    const response = await this.assesmentAgencyRepo.updateStatusApproved(id, paymentPercentage);
    await sendEmail(
      SENDER_EMAIL,
      response.email,
      "Application Approved",
      "Your Application has been Approved by the Admin. You can now login to the portal and start your Assesment services. Thank You"
    );
    return response;
  }

  async updateStatusToRejected(id) {
    await this.getAgencyOrFail(id);
    return this.assesmentAgencyRepo.updateStatusRejected(id);
  }

  async getAssesmentAgencyById(assesmentId) {
    return this.assesmentAgencyRepo.get(assesmentId);
  }

  async getAllAssesmentAgency(pagination) {
    return this.assesmentAgencyRepo.getAll(pagination);
  }

  async getAllPendingAssesmentAgencyApplocations() {
    return this.assesmentAgencyRepo.getAllPendingApplications();
  }

  async getAllApprovedAssesmentAgency() {
    return this.assesmentAgencyRepo.getAllApprovedApplications();
  }

  async fiterData(query) {
    const { sector, state, course } = query;
    const queryObject = {};
    if (sector) {
      queryObject.sectors = { $in: [String(sector)] };
    }
    if (state) {
      queryObject.state_Under_geographicalRegion = String(state);
    }
    if (course) {
      queryObject.courses = { $in: [String(course)] };
    }
    return this.assesmentAgencyRepo.filterData(queryObject);
  }

  // ** only the agency itself (or an admin) may change where its payments go
  async addbankDetails(assesmentAgencyId, accountNumber, IFSC_Code, bankName, branchName, user) {
    await this.getAgencyOrFail(assesmentAgencyId);
    assertOwnerOrAdmin(assesmentAgencyId, user);
    if (!accountNumber || !IFSC_Code || !bankName) {
      throw new AppError("Account number, IFSC code and bank name are required");
    }
    return this.assesmentAgencyRepo.updateBankDetails(
      assesmentAgencyId,
      String(accountNumber),
      String(IFSC_Code),
      String(bankName),
      branchName ? String(branchName) : undefined
    );
  }
}

export default AssesmentAgencyService;
