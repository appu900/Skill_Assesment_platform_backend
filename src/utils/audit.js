import AuditLog from "../models/AuditLog.model.js";
import logger from "./logger.js";

const SECRET_FIELDS = ["password", "passwordResetTokenHash", "passwordResetExpires", "tokenVersion"];

const strip = (value) => {
  if (!value || typeof value !== "object") return value ?? null;
  const copy = { ...value };
  for (const field of SECRET_FIELDS) delete copy[field];
  return copy;
};

// ** request context of the actor, so every entry says where it came from
export const auditContext = (req) => ({
  actorId: req.user?.id ?? null,
  actorRole: req.user?.role ?? null,
  ip: req.ip ?? null,
  userAgent: req.headers?.["user-agent"]?.slice(0, 300) ?? null,
});

// ** an audit failure is logged but never breaks the action that was audited
export async function audit(context, { module, action, entity, entityId = null, before = null, after = null, note = null, actorId, actorRole }) {
  try {
    await AuditLog.create({
      module,
      action,
      entity,
      entityId,
      before: strip(before),
      after: strip(after),
      note,
      actorId: actorId ?? context?.actorId ?? null,
      actorRole: actorRole ?? context?.actorRole ?? null,
      ip: context?.ip ?? null,
      userAgent: context?.userAgent ?? null,
    });
  } catch (error) {
    logger.error("audit log write failed", error.message);
  }
}
