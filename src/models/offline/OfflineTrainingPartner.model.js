import mongoose from "mongoose";

// ** a training partner CUTM works with offline: created by the admin with the same details as a public
// ** signup (same field names as trainingpartners), but it never logs in
const offlineTrainingPartnerSchema = new mongoose.Schema(
  {
    tpCode: { type: String, unique: true },
    // ** offline wing type: decides how its batches are handled
    category: { type: String, enum: ["Corporate", "Government"], required: true },

    // ---- organisation (signup step 1)
    organizationName: { type: String, required: true, trim: true },
    organizationCategory: { type: String, trim: true },
    dateOfIncorporation: { type: Date },
    affiliation: { type: String, trim: true },
    pan: { type: String, trim: true, uppercase: true },
    prnNo: { type: String, trim: true },
    scheme: { type: String, trim: true },
    schemeType: { type: String, trim: true },
    centerId: { type: String, trim: true },

    // ---- registered office (signup step 2)
    registeredOfficeAddress: { type: String, trim: true },
    registeredOfficeCity: { type: String, trim: true },
    registeredOfficeDist: { type: String, trim: true },
    registeredOfficeState: { type: String, trim: true },
    registeredOfficePin: { type: String, trim: true },
    registeredOfficeEmail: { type: String, trim: true, lowercase: true },
    registeredOfficeMobile: { type: String, trim: true },
    registeredOfficeTelephone: { type: String, trim: true },
    registeredOfficeGst: { type: String, trim: true, uppercase: true },
    website: { type: String, trim: true },

    // ---- people (signup step 3)
    headOwnerName: { type: String, trim: true },
    headOwnerDob: { type: Date },
    headOwnerMobile: { type: String, trim: true },
    headOwnerEmail: { type: String, trim: true, lowercase: true },
    headOwnerQualification: { type: String, trim: true },
    headOwnerPanNo: { type: String, trim: true, uppercase: true },
    headOwnerAadharNo: { type: String, trim: true },
    projectContactPersonName: { type: String, trim: true },
    projectContactPersonDesignation: { type: String, trim: true },
    projectContactPersonMobile: { type: String, trim: true },
    projectContactPersonEmail: { type: String, trim: true, lowercase: true },

    // ---- sectors & courses (signup step 4)
    sector: [{ type: String, trim: true }],
    courses: [{ type: String, trim: true }],

    notes: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdByAdmin: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  {
    timestamps: true,
    collection: "offline_training_partners",
    toJSON: {
      // ** only the last 4 digits of the Aadhaar ever leave the server
      transform: (doc, ret) => {
        if (ret.headOwnerAadharNo) ret.headOwnerAadharNo = `XXXXXXXX${String(ret.headOwnerAadharNo).slice(-4)}`;
        return ret;
      },
    },
  }
);

const OfflineTrainingPartner = mongoose.model("OfflineTrainingPartner", offlineTrainingPartnerSchema);
export default OfflineTrainingPartner;
