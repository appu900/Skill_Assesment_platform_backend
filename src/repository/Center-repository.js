import CrudRepository from "./crud.repository.js";
import Center from "../models/Center.js";
import AppError from "../utils/AppError.js";

class CenterRepository extends CrudRepository {
  constructor() {
    super(Center);
  }

  async fetchCenterDetails(centerId) {
    return Center.findById(centerId).populate("trainingOrganizationId").populate("sectors");
  }

  async getCenterByTrainingPartnerId(trainingPartnerId) {
    return Center.find({ trainingOrganizationId: trainingPartnerId }).populate({
      path: "sectors",
      populate: {
        path: "courses",
        model: "Course",
        select: "courseName _id",
      },
    });
  }

  async filterCenters(queryObject) {
    return Center.find(queryObject).populate("sectors").populate("trainingOrganizationId");
  }

  async approveSchemesOfCenter(centerId, schemeName, state) {
    const center = await Center.findOne({
      _id: centerId,
      "schemes.schemeName": schemeName,
      state: state,
    });
    if (!center) {
      throw AppError.notFound("Center not found for this scheme and state");
    }
    const scheme = center.schemes.find((item) => item.schemeName === schemeName);
    scheme.approveStatus = true;
    scheme.rejectStatus = false;
    scheme.rejectReason = undefined;
    await center.save();
    return true;
  }

  async rejectSchemeOfCenter(centerId, schemeName, state, reason) {
    const center = await Center.findOne({
      _id: centerId,
      "schemes.schemeName": schemeName,
      state: state,
    });
    if (!center) {
      throw AppError.notFound("Center not found for this scheme and state");
    }
    const scheme = center.schemes.find((item) => item.schemeName === schemeName);
    if (scheme.approveStatus) {
      throw new AppError("this scheme is already approved for the center");
    }
    scheme.rejectStatus = true;
    scheme.rejectReason = reason;
    await center.save();
    return true;
  }

  async getCentersByApprovedSchems(trainingPartnerId, schemeName, state) {
    return Center.find({
      trainingOrganizationId: trainingPartnerId,
      state: state,
      schemes: {
        $elemMatch: {
          schemeName,
          approveStatus: true,
        },
      },
    }).populate("sectors");
  }

  async updateCenterData(centerId, updateData) {
    return Center.findOneAndUpdate(
      { _id: centerId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  async getAllCentersByASchemeName(schemeName, stateName) {
    return Center.find({
      "schemes.schemeName": schemeName,
      state: stateName,
    });
  }
}

export default CenterRepository;
