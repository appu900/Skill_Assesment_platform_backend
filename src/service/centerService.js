import CenterRepository from "../repository/Center-repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";
import SchemeRepository from "../repository/SchemeRepository.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { omit } from "../utils/fieldFilter.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";

// ** a training partner can never change these on its own center (approval is done by the SNA)
const PROTECTED_FIELDS = [
  "_id",
  "trainingOrganizationId",
  "createdAt",
  "updatedAt",
  "PRN_NO",
  "state",
  "schemes",
];

// ** an SNA can only act on its own scheme and state, an admin on whatever it sends
const resolveSchemeAndState = (user, schemeName, state) =>
  user?.role === ROLES.SNA
    ? { schemeName: user.scheme, state: user.state }
    : { schemeName, state };

class CenterService {
  constructor() {
    this.centerRepository = new CenterRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
    this.schemeRepository = new SchemeRepository();
  }

  async create(data, trainingPartnerId) {
    const tp = await this.trainingPartnerRepository.get(trainingPartnerId);
    if (!tp) {
      throw AppError.notFound("Training partner not found");
    }

    // ** every scheme of a new center starts unapproved, whatever the client sends
    const schemes = Array.isArray(data.schemes)
      ? data.schemes.map((scheme) => ({ schemeName: scheme.schemeName, approveStatus: false }))
      : data.schemes;

    const center = await this.centerRepository.create({
      ...omit(data, ["_id", "trainingOrganizationId", "schemes"]),
      schemes,
      trainingOrganizationId: tp._id,
    });
    tp.centers.push(center._id);
    await tp.save();
    return center;
  }

  async get(id) {
    return this.centerRepository.getCenterByTrainingPartnerId(id);
  }

  async getACenterDetails(centerId) {
    return this.centerRepository.fetchCenterDetails(centerId);
  }

  // ** centers waiting for approval of a scheme in a state
  async filterCentersData(query, user) {
    const { schemeName, state } = resolveSchemeAndState(user, query.schemeName, query.state);
    if (!state || !schemeName) {
      throw new AppError("Please provide state and scheme");
    }
    return this.centerRepository.filterCenters({
      state: String(state),
      schemes: {
        $elemMatch: {
          schemeName: String(schemeName),
          approveStatus: false,
          rejectStatus: { $ne: true },
        },
      },
    });
  }

  async corporateSchemeNames() {
    return (await this.schemeRepository.findBySchemeType("Corporate")).map((scheme) => scheme.name);
  }

  // ** LC/RC: centres with a corporate scheme waiting for approval
  async getPendingCorporateCenters() {
    const schemeNames = await this.corporateSchemeNames();
    return this.centerRepository.filterCenters({
      schemes: {
        $elemMatch: { schemeName: { $in: schemeNames }, approveStatus: false, rejectStatus: { $ne: true } },
      },
    });
  }

  // ** LC/RC approves / rejects a corporate scheme of a centre (the state is the centre's own)
  async decideCorporateCenter(centerId, schemeName, approve, reason) {
    if (!schemeName) {
      throw new AppError("Please provide schemeName");
    }
    if (!(await this.corporateSchemeNames()).includes(String(schemeName))) {
      throw new AppError(`${schemeName} is not a corporate scheme`);
    }
    const center = await this.centerRepository.fetchCenterDetails(centerId);
    if (!center) {
      throw AppError.notFound("Center not found");
    }
    if (approve) {
      return this.centerRepository.approveSchemesOfCenter(centerId, String(schemeName), center.state);
    }
    if (!reason || !String(reason).trim()) {
      throw new AppError("Please give a reason for the rejection");
    }
    return this.centerRepository.rejectSchemeOfCenter(centerId, String(schemeName), center.state, String(reason).trim().slice(0, 500));
  }

  async approveCenter(centerId, bodySchemeName, bodyState, user) {
    const { schemeName, state } = resolveSchemeAndState(user, bodySchemeName, bodyState);
    if (!schemeName || !state) {
      throw new AppError("Please provide schemeName and state");
    }
    return this.centerRepository.approveSchemesOfCenter(centerId, String(schemeName), String(state));
  }

  async rejectCenter(centerId, bodySchemeName, bodyState, reason, user) {
    const { schemeName, state } = resolveSchemeAndState(user, bodySchemeName, bodyState);
    if (!schemeName || !state) {
      throw new AppError("Please provide schemeName and state");
    }
    if (!reason || !String(reason).trim()) {
      throw new AppError("Please give a reason for the rejection");
    }
    return this.centerRepository.rejectSchemeOfCenter(
      centerId,
      String(schemeName),
      String(state),
      String(reason).trim().slice(0, 500)
    );
  }

  async updateSectorsInCenters(centerId, sectorId) {
    const center = await this.centerRepository.get(centerId);
    if (!center) {
      throw AppError.notFound("Center not found");
    }
    center.sectors.addToSet(sectorId);
    await center.save();
    return true;
  }

  async getAllCentersByApproveSchems(trainingPartnerId, schemeName, state) {
    return this.centerRepository.getCentersByApprovedSchems(
      trainingPartnerId,
      String(schemeName),
      String(state)
    );
  }

  async updateCenterData(centerId, data, user) {
    if (!centerId || !data) {
      throw new AppError("Please provide centerId and data");
    }
    const center = await this.centerRepository.get(centerId);
    if (!center) {
      throw AppError.notFound("Center not found");
    }
    assertOwnerOrAdmin(center.trainingOrganizationId, user, "This center does not belong to you");
    return this.centerRepository.updateCenterData(centerId, omit(data, PROTECTED_FIELDS));
  }

  async getAllCentersBySchemeName(scheme, state) {
    return this.centerRepository.getAllCentersByASchemeName(String(scheme), String(state));
  }
}

export default CenterService;
