import mongoose from "mongoose";

// ** who did what to which record, when (append only; written by utils/audit.js)
const auditLogSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, enum: ["core", "toa", "offline"] },
    actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    actorRole: { type: String, default: null },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // ** only the changed fields, never passwords or tokens
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    note: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
