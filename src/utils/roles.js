const ROLES = {
  ADMIN: "Admin",
  TRAINING_PARTNER: "TrainingPartner",
  ASSESMENT_AGENCY: "AssesmentAgency",
  SNA: "SNA",
  // ** LC/RC: approves corporate centres, batches and results (what the admin does for government ones)
  LCRC: "LCRC",
  // ** RailTel Training of Assessors module: separate accounts, created by the admin, never mixed with the roles above
  TOA_TRAINING_PARTNER: "ToaTrainingPartner",
  // ** a person trained under RailTel ToA ("assessor" in the FRD); can log in to see results and download certificates
  TOA_ASSESSOR: "ToaAssessor",
};

// ** roles of the skill certification portal; "any logged in user" means one of these, never a ToA account
export const CORE_ROLES = [ROLES.ADMIN, ROLES.TRAINING_PARTNER, ROLES.ASSESMENT_AGENCY, ROLES.SNA, ROLES.LCRC];

export default ROLES;
