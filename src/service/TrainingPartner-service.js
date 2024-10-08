import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";
import sender from "../config/emailconfig.js";
import sendEmail from "./email-service.js";

class TrainingPartnerService {
  constructor() {
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  //   ** create trainingPartner
  async createTrainingPartner(data) {
    try {
      const userPassword = data.password;
      const responsePayload = await this.trainingPartnerRepository.create(data);

      console.log("responsePayload", responsePayload);

      sendEmail(
        "awardingbody@cutm.ac.in",
        responsePayload.registeredOfficeEmail,
        "TrainingOrganization Created",
        `Your Training Organization has been created successfully. Your login credentials are registerdOfficeEmail and password is ${userPassword}`
      );
      
      return responsePayload;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Training Partner already exists with is email");
      }
      throw error;
    }
  }

  // ** login functionality of traingPartner
  async login(email, password) {
    try {
      console.log(email, password, "service layer");
      const trainingPartner = await this.trainingPartnerRepository.findByEmail(
        email
      );
      if (!trainingPartner) {
        throw new Error("user not found with this email");
      }
      if (!trainingPartner.checkPassword(password)) {
        throw new Error("incorrect Password");
      }
      const token = trainingPartner.generateJwt();
      const response = {
        data: trainingPartner,
        token: token,
      };
      console.log(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** get a trainingPartnerData based on Id
  async getTrainingPartnerById(id) {
    try {
      const res = this.trainingPartnerRepository.get(id);
      return res;
    } catch (error) {
      throw error;
    }
  }

  // ** get all tp data

  async getAllTrainingParterData() {
    try {
      const res = await this.trainingPartnerRepository.getAll();
      return res;
    } catch (error) {
      console.log("error in getting all trainingPartner data", error.message);
      throw error;
    }
  }

  async updateTrainingPartnerDetails(id, data) {
    try {
      const tp = await this.trainingPartnerRepository.get(id);

      if (!tp) {
        throw new Error("Training Partner details not found");
      }
      const response = await this.trainingPartnerRepository.update(id, data);
      return response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async ApproveApplication(id, paymentAmount) {
    try {
      const tp = await this.trainingPartnerRepository.get(id);
      if (!tp) {
        throw new Error("Training Partner not found");
      }


      // ** check if the tp -> scheme is not corporate then paymentAmount should be 0

      const trainingPartnerScheme = tp.scheme;
      if (trainingPartnerScheme !== "Corporate") {
        paymentAmount = 0;
      }

      const response =
        await this.trainingPartnerRepository.updateStatusApproved(
          id,
          paymentAmount
        );
      console.log("Approved Response Data", response.registeredOfficeEmail);
      sendEmail(
        "awardingbody@cutm.ac.in",
        response.registeredOfficeEmail,
        "Application Approved",
        `Your Application has been Approved by the Admin. You can now login to the portal and start your training services. Thank You and your login credentials are email`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async rejectApplication(id) {
    try {
      const response =
        await this.trainingPartnerRepository.updateStatusRejected(id);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getNewOnbordedTrainingPartner() {
    try {
      const response =
        await this.trainingPartnerRepository.getNewPendingRequests();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllApprovedTrainingPartner() {
    try {
      const response =
        await this.trainingPartnerRepository.getApprovedApplications();
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** filter trainingPartner based on differnet query parameters
  /**
   *  scheme
   *  sector []
   *  state
   *  course []
   */
  async getTrainingPartnersAccordingTofilter(query) {
    try {
      const { sector, registeredOfficeState, course, scheme } = query;
      const queryObject = {};
      if (sector) {
        queryObject.sector = { $in: [sector] };
      }
      if (registeredOfficeState) {
        queryObject.registeredOfficeState = registeredOfficeState;
      }
      if (course) {
        queryObject.courses = { $in: [course] };
      }
      if (scheme) {
        queryObject.scheme = scheme;
      }

      const response = await this.trainingPartnerRepository.filterData(
        queryObject
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** update personal information of TrainingPartner sector and email

  async updateEmail(trainingPartnerId, newEmail) {
    try {
      const tp = await this.trainingPartnerRepository.get(trainingPartnerId);

      if (!tp) {
        throw new Error("trainingPartner not found");
      }

      const response = await this.trainingPartnerRepository.updateEmail(
        trainingPartnerId,
        newEmail
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateSector(id, sectorName) {
    try {
      const tp = await this.trainingPartnerRepository.get(id);
      if (!tp) {
        throw new Error("training Partner not found");
      }

      tp.sector.push(sectorName);
      const response = await tp.save();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateCourse(id, courseName) {
    try {
      const trainingPartner = await this.trainingPartnerRepository.get(id);
      if (!trainingPartner) {
        throw new Error("training partner not found");
      }
      trainingPartner.courses.push(courseName);
      const response = await trainingPartner.save();
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default TrainingPartnerService;
