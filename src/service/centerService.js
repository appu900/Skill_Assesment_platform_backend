import CenterRepository from "../repository/Center-repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";

class CenterService {
  constructor() {
    this.centerRepository = new CenterRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
  }

  async create(data) {
    try {
      console.log("payload", data);
      const tp = await this.trainingPartnerRepository.get(
        data.trainingOrganizationId
      );
      if (!tp) {
        throw new Error("Training partner not found");
      }
      const center = await this.centerRepository.create(data);
      tp.centers.push(center);
      await tp.save();
      return center;
    } catch (error) {
      throw error;
    }
  }

  async get(id) {
    try {
      const response = await this.centerRepository.getCenterByTrainingPartnerId(
        id
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterCentersData(query) {
    try {
      const queryObject = {};
      const { state, schemeName } = query;
      if (!state || !schemeName) {
        throw new Error("Please provide state or scheme");
      }
      if (state) {
        queryObject.state = state;
      }

      if (schemeName) {
        queryObject["schemes"] = {
          $elemMatch: {
            schemeName: schemeName,
            approveStatus: false,
          },
        };
      }
      const response = await this.centerRepository.filterCenters(queryObject);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async approveCenter(centerId, schemeName, state) {
    try {
      const response = await this.centerRepository.approveSchemesOfCenter(
        centerId,
        schemeName,
        state
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateSectorsInCenters(centerId, sectorId) {
    try {
      const center = await this.centerRepository.get(centerId);
      if (!center) {
        throw new Error("Center not found");
      }
      center.sectors.push(centerId);
      await center.save();
      return true;
    } catch (error) {
      throw error;
    }
  }

  async updateSchemeInCenter(centerId, data) {
    try {
      const center = await this.centerRepository.get(centerId);
      if (!center) {
        throw new Error("Center not found");
      }
      center.schemes.push(data);
      await center.save();
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getAllCentersByApproveSchems(trainingPartnerId, schemeName, state) {
    try {
      const centers = await this.centerRepository.getCentersByApprovedSchems(
        trainingPartnerId,
        schemeName,
        state
      );
      return centers;
    } catch (error) {
      throw error;
    }
  }

  async updateCenterData(centerId, data, trainingPartnerId) {
    try {
      if (!centerId || !data || !trainingPartnerId) {
        throw new Error("Please provide centerId,data and trainingPartnerId");
      }
      const center = await this.centerRepository.updateCenterData(
        centerId,
        data,
        trainingPartnerId
      );
      return center;
    } catch (error) {
      throw error;
    }
  }

  async getAllCentersBySchemeName(scheme, state) {
    try {
      const response = await this.centerRepository.getAllCentersByASchemeName(
        scheme,
        state
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default CenterService;
