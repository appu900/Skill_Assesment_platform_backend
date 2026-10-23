import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";
import sendEmail from "./email-service.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { omit } from "../utils/fieldFilter.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";

// ** fields a training partner can never set on its own record
const PROTECTED_FIELDS = [
  "_id",
  "role",
  "tpCode",
  "applicationStatus",
  "applicationViewed",
  "editPermission",
  "noOfEditRequest",
  "organizationCorporatePaymentFee",
  "paymentStatus",
  "status",
  "centers",
  "certificates",
  "createdAt",
  "updatedAt",
];

class TrainingPartnerService {
  constructor() {
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  async getTrainingPartnerOrFail(id) {
    const tp = await this.trainingPartnerRepository.get(id);
    if (!tp) {
      throw AppError.notFound("Training Partner not found");
    }
    return tp;
  }

  //   ** create trainingPartner (public registration)
  async createTrainingPartner(data) {
    try {
      const responsePayload = await this.trainingPartnerRepository.create(
        omit(data, PROTECTED_FIELDS)
      );
      // ** never send the password over email
      await sendEmail(
        SENDER_EMAIL,
        responsePayload.registeredOfficeEmail,
        "TrainingOrganization Created",
        "Your Training Organization application has been submitted successfully. You can login with your registered office email and the password you have set once the application is approved."
      );
      return responsePayload;
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict("Training Partner already exists with this email");
      }
      throw error;
    }
  }

  // ** login functionality of traingPartner
  async login(email, password) {
    if (!email || !password) {
      throw new AppError("Email and password are required");
    }
    const trainingPartner = await this.trainingPartnerRepository.findByEmail(email);
    if (!trainingPartner || !trainingPartner.checkPassword(password)) {
      throw AppError.unauthorized("Invalid email or password");
    }
    return {
      data: trainingPartner,
      token: trainingPartner.generateJwt(),
    };
  }

  async getTrainingPartnerById(id) {
    return this.trainingPartnerRepository.get(id);
  }

  async getAllTrainingParterData(pagination) {
    return this.trainingPartnerRepository.getAll(pagination);
  }

  // ** admin can update any non sensitive field, a training partner only its own profile fields
  async updateTrainingPartnerDetails(id, data, user) {
    await this.getTrainingPartnerOrFail(id);
    assertOwnerOrAdmin(id, user);

    // ** password must go through save() to be hashed, never through a direct update
    const blockedFields =
      user.role === ROLES.ADMIN
        ? ["_id", "role", "tpCode", "password", "createdAt", "updatedAt"]
        : [...PROTECTED_FIELDS, "password", "registeredOfficeEmail"];

    return this.trainingPartnerRepository.update(id, omit(data, blockedFields));
  }

  async ApproveApplication(id, paymentAmount) {
    const tp = await this.getTrainingPartnerOrFail(id);

    // ** only corporate training partners pay a per student fee
    let fee = Number(paymentAmount) || 0;
    if (tp.scheme !== "Corporate") {
      fee = 0;
    }
    if (fee < 0) {
      throw new AppError("Payment amount cannot be negative");
    }

    const response = await this.trainingPartnerRepository.updateStatusApproved(id, fee);
    await sendEmail(
      SENDER_EMAIL,
      response.registeredOfficeEmail,
      "Application Approved",
      "Your Application has been Approved by the Admin. You can now login to the portal with your registered office email and start your training services. Thank You"
    );
    return response;
  }

  async rejectApplication(id) {
    await this.getTrainingPartnerOrFail(id);
    return this.trainingPartnerRepository.updateStatusRejected(id);
  }

  async getNewOnbordedTrainingPartner() {
    return this.trainingPartnerRepository.getNewPendingRequests();
  }

  async getAllApprovedTrainingPartner() {
    return this.trainingPartnerRepository.getApprovedApplications();
  }

  // ** filter trainingPartner based on scheme, sector, state and course
  async getTrainingPartnersAccordingTofilter(query) {
    const { sector, registeredOfficeState, course, scheme } = query;
    const queryObject = {};
    if (sector) {
      queryObject.sector = { $in: [String(sector)] };
    }
    if (registeredOfficeState) {
      queryObject.registeredOfficeState = String(registeredOfficeState);
    }
    if (course) {
      queryObject.courses = { $in: [String(course)] };
    }
    if (scheme) {
      queryObject.scheme = String(scheme);
    }
    return this.trainingPartnerRepository.filterData(queryObject);
  }

  async updateEmail(trainingPartnerId, newEmail, user) {
    await this.getTrainingPartnerOrFail(trainingPartnerId);
    assertOwnerOrAdmin(trainingPartnerId, user);
    if (!newEmail) {
      throw new AppError("Email is required");
    }
    try {
      return await this.trainingPartnerRepository.updateEmail(trainingPartnerId, String(newEmail));
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict("This email is already used by another Training Partner");
      }
      throw error;
    }
  }

  async updateSector(id, sectorName, user) {
    const tp = await this.getTrainingPartnerOrFail(id);
    assertOwnerOrAdmin(id, user);
    if (!sectorName) {
      throw new AppError("Sector is required");
    }
    tp.sector.addToSet(String(sectorName));
    return tp.save();
  }

  async updateCourse(id, courseName, user) {
    const tp = await this.getTrainingPartnerOrFail(id);
    assertOwnerOrAdmin(id, user);
    if (!courseName) {
      throw new AppError("Course is required");
    }
    tp.courses.addToSet(String(courseName));
    return tp.save();
  }
}

export default TrainingPartnerService;
