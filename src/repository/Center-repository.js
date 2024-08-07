import CrudRepository from "./crud.repository.js";
import Center from "../models/Center.js";

class CenterRepository extends CrudRepository {
  constructor() {
    super(Center);
  }

  async getCenterByTrainingPartnerId(trainingPartnerId) {
    try {
      const response = await Center.find({
        trainingOrganizationId: trainingPartnerId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterCenters(queryObject) {
    try {
      const response = await Center.find(queryObject)
        .populate("sectors")
        .populate("trainingOrganizationId");
      return response;
    } catch (error) {
      throw error;
    }
  }

  async approveSchemesOfCenter(centerId, schemeName, state) {
    try {
      const center = await Center.findOne({
        _id: centerId,
        "schemes.schemeName": schemeName,
        state: state,
      });

      if (!center) {
        throw new Error("Center not found");
      }
      const scheme = center.schemes.find(
        (scheme) => scheme.schemeName === schemeName
      );
      if (scheme) {
        scheme.approveStatus = true;
        await center.save();
        return true;
      } else {
        throw new Error("Scheme not found");
      }
    } catch (error) {
      throw error;
    }
  }

  async getCentersByApprovedSchems(trainingPartnerId, schemeName, state) {
    try {
      const filter = {
        trainingOrganizationId: trainingPartnerId,
        state: state,
        schemes: {
          $elemMatch: {
            schemeName,
            approveStatus: true,
          },
        },
      };
      console.log(filter);
      const response = await Center.find(filter);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateCenterData(centerId, updateData, trainingPartnerId) {
    try {
      const center = await Center.findById(centerId);
      if (!center) {
        throw new Error("Center not found");
      }

      // ** check if the center belongs to the training partner
      if (center.trainingOrganizationId.toString() !== trainingPartnerId) {
        throw new Error("Unauthorized attempt");
      }

      // ** remove the protected fields
      const protectedFields = [
        "_id",
        "trainingOrganizationId",
        "createdAt",
        "updatedAt",
        "PRN_NO",
        "state",
      ];
      protectedFields.forEach((field) => delete updateData[field]);

      // ** update the center data
      const updatedCenter = await Center.findOneAndUpdate(
        { _id: centerId },
        { $set: updateData },
        { new: true,runValidators: true }
      );

      return updatedCenter;
      
    } catch (error) {
      throw error;
    }
  }
}

export default CenterRepository;
