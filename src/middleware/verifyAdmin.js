import { allow, ROLES } from "./auth.js";

const verifyIsAdmin = allow(ROLES.ADMIN);

export default verifyIsAdmin;
