import mongoose from "mongoose";

export const BATCH_STATUSES = ["draft", "submitted", "under_review", "returned", "approved", "rejected", "completed"];
export const SESSION_STATUSES = ["not_marked", "draft", "submitted", "approved", "returned"];

const sessionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, trim: true },
  endTime: { type: String, trim: true },
  topic: { type: String, trim: true },
  // ** attendance of this session: marked by the TP, submitted, then approved by CUTM
  attendanceStatus: { type: String, enum: SESSION_STATUSES, default: "not_marked" },
  evidenceKey: { type: String, default: null },
  attendanceSubmittedAt: { type: Date, default: null },
  attendanceDecidedAt: { type: Date, default: null },
  attendanceRemarks: { type: String, default: null },
});

const enrolmentSchema = new mongoose.Schema(
  {
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainee", required: true },
    enrolledAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: String,
    remarks: String,
    reference: String,
    byRole: String,
    by: mongoose.Schema.Types.ObjectId,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const toaBatchSchema = new mongoose.Schema(
  {
    batchCode: { type: String, unique: true },
    toaTpId: { type: mongoose.Schema.Types.ObjectId, ref: "ToaTrainingPartner", required: true, index: true },

    programmeName: { type: String, required: true, trim: true },
    trainingMode: { type: String, enum: ["Offline", "Online", "Hybrid"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    schedule: { type: String, trim: true },
    trainerName: { type: String, trim: true },
    trainerMobile: { type: String, trim: true },
    trainerEmail: { type: String, trim: true, lowercase: true },
    trainerQualification: { type: String, trim: true },
    venue: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    capacity: { type: Number, required: true, min: 1 },

    trainees: [enrolmentSchema],
    sessions: [sessionSchema],

    status: { type: String, enum: BATCH_STATUSES, default: "draft", index: true },
    remarks: { type: String, default: null },
    submissionRef: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    history: [historySchema],

    // ** results / certificates
    resultsStatus: { type: String, enum: ["not_started", "draft", "approved", "published"], default: "not_started" },
    resultsApprovedAt: { type: Date, default: null },
    resultsPublishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "toa_batches" }
);

toaBatchSchema.index({ "trainees.trainee": 1 });

const ToaBatch = mongoose.model("ToaBatch", toaBatchSchema);
export default ToaBatch;
