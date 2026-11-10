// ** every configurable setting: its default and the fields an override may set.
// ** resolution order (lowest to highest): default -> global -> schemeType -> scheme -> trainingPartner -> trainingPartner + scheme

const SETTINGS = {
  fees: {
    description: "How the fee of a submitted batch is calculated",
    default: {
      rateSource: "scheme", // scheme price, the training partner's corporate fee, or a fixed rate
      perCandidate: 0, // used when rateSource is "fixed"
      gstPercent: 0,
    },
    fields: {
      rateSource: { type: "enum", values: ["scheme", "trainingPartner", "fixed"] },
      perCandidate: { type: "number", min: 0 },
      gstPercent: { type: "number", min: 0, max: 100 },
    },
  },
  batchRules: {
    description: "What a batch needs before the training partner can submit it",
    default: {
      minCandidates: 1,
      maxCandidates: 0, // 0 means no limit
      requireCandidatePhoto: true,
      requireTrainer: true,
    },
    fields: {
      minCandidates: { type: "integer", min: 1 },
      maxCandidates: { type: "integer", min: 0 },
      requireCandidatePhoto: { type: "boolean" },
      requireTrainer: { type: "boolean" },
    },
  },
  toaProgramme: {
    description: "RailTel Training of Assessors: fees, eligibility and portal options (can be overridden per ToA training partner)",
    default: {
      feeMode: "per_assessor", // per_assessor = fee x enrolled assessors, per_batch = one fee per batch
      feeAmount: 0,
      gstPercent: 18,
      invoiceDueDays: 15,
      minAttendancePercent: 75,
      passMark: 50,
      paymentRequiredForCertificate: true,
      assessorPortalEnabled: true,
      maxBatchCapacity: 60,
    },
    fields: {
      feeMode: { type: "enum", values: ["per_assessor", "per_batch"] },
      feeAmount: { type: "number", min: 0 },
      gstPercent: { type: "number", min: 0, max: 100 },
      invoiceDueDays: { type: "integer", min: 0, max: 365 },
      minAttendancePercent: { type: "number", min: 0, max: 100 },
      passMark: { type: "number", min: 0, max: 100 },
      paymentRequiredForCertificate: { type: "boolean" },
      assessorPortalEnabled: { type: "boolean" },
      maxBatchCapacity: { type: "integer", min: 1, max: 1000 },
    },
  },
};

// ** built-in values stored on first start, so they show up (and can be edited) like any other setting.
// ** they keep today's behaviour: corporate batches pay the partner's fee plus 18% GST.
export const SEEDED_SETTINGS = [
  { key: "fees", scope: "schemeType", schemeType: "Corporate", value: { rateSource: "trainingPartner", gstPercent: 18 } },
];

export const settingKeys = () => Object.keys(SETTINGS);
export const getSetting = (key) => SETTINGS[key];

// ** checks a (partial) override value; returns a list of problems, empty when valid
export function validateSettingValue(key, value) {
  const setting = SETTINGS[key];
  if (!setting) return [`unknown setting "${key}"`];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["value must be an object"];
  const errors = [];
  for (const [field, fieldValue] of Object.entries(value)) {
    const rule = setting.fields[field];
    if (!rule) {
      errors.push(`"${field}" is not a field of ${key}`);
      continue;
    }
    if (rule.type === "enum" && !rule.values.includes(fieldValue)) {
      errors.push(`${field} must be one of ${rule.values.join(", ")}`);
    }
    if (rule.type === "boolean" && typeof fieldValue !== "boolean") {
      errors.push(`${field} must be true or false`);
    }
    if (rule.type === "number" || rule.type === "integer") {
      if (typeof fieldValue !== "number" || Number.isNaN(fieldValue)) {
        errors.push(`${field} must be a number`);
        continue;
      }
      if (rule.type === "integer" && !Number.isInteger(fieldValue)) errors.push(`${field} must be a whole number`);
      if (rule.min !== undefined && fieldValue < rule.min) errors.push(`${field} must be at least ${rule.min}`);
      if (rule.max !== undefined && fieldValue > rule.max) errors.push(`${field} must be at most ${rule.max}`);
    }
  }
  return errors;
}

export default SETTINGS;
