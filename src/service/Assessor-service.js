import AssessorRepository from "../repository/Assessor-Repository.js";
import AppError from "../utils/AppError.js";
import ROLES from "../utils/roles.js";
import { omit } from "../utils/fieldFilter.js";
import { assertOwnerOrAdmin } from "../utils/ownership.js";

class AssessorService {
  constructor() {
    this.assessorRepository = new AssessorRepository();
  }

  // ** an assesment agency creates assessors for itself, an admin has to say for which agency
  async create(data, user) {
    const payload = omit(data, ["_id", "resultSheet"]);
    if (user.role === ROLES.ASSESMENT_AGENCY) {
      payload.AssesmentAgency = user.id;
    }
    if (!payload.AssesmentAgency) {
      throw new AppError("AssesmentAgency is required");
    }
    return this.assessorRepository.create(payload);
  }

  async uploadAssessorMarkSheet(id, marksheetUrlLink, user) {
    const assessor = await this.assessorRepository.get(id);
    if (!assessor) {
      throw AppError.notFound("Assessor Not found");
    }
    assertOwnerOrAdmin(assessor.AssesmentAgency, user, "This assessor does not belong to you");
    if (!marksheetUrlLink) {
      throw new AppError("markSheet file is required");
    }
    assessor.resultSheet = marksheetUrlLink;
    await assessor.save();
    return true;
  }

  async getAllAssesorOfAssesmentAgency(assesmentAgencyId) {
    return this.assessorRepository.getAllAssesorByAssesmentAgencyId(assesmentAgencyId);
  }
}

export default AssessorService;
