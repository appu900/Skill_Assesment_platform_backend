import Sequence from "../../models/sequence.model.js";

// ** next number of a named counter (atomic, shared by every api instance)
export async function nextNumber(name) {
  const sequence = await Sequence.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return sequence.seq;
}

// ** Indian financial year of a date, e.g. "2026-27"
export function financialYear(date = new Date()) {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

export const pad = (value, length) => String(value).padStart(length, "0");

// ** assessor ids of a batch roster, whether or not the roster was populated
export const rosterIds = (batch) => batch.trainees.map((entry) => String(entry.trainee?._id ?? entry.trainee));
