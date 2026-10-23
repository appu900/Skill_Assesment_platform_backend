import { allow, ROLES } from "./auth.js";

const verifyAssesmentAgency = allow(ROLES.ASSESMENT_AGENCY);

export default verifyAssesmentAgency;
