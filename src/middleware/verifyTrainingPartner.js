import { allow, ROLES } from "./auth.js";

const verifyIsTrainingPartner = allow(ROLES.TRAINING_PARTNER);

export default verifyIsTrainingPartner;
