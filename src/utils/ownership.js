import AppError from "./AppError.js";
import ROLES from "./roles.js";

const toId = (value) => (value && value._id ? String(value._id) : String(value));

const isSameId = (a, b) => Boolean(a) && Boolean(b) && toId(a) === toId(b);

// ** admin may act on everything, every other role only on records it owns
const assertOwnerOrAdmin = (ownerId, user, message = "You can only modify your own records") => {
  if (user?.role === ROLES.ADMIN) {
    return;
  }
  if (!isSameId(ownerId, user?.id)) {
    throw AppError.forbidden(message);
  }
};

export { isSameId, assertOwnerOrAdmin };
