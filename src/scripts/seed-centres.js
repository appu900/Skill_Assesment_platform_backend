// ** seeds sample centres for a training partner: `npm run seed:centres -- <tp email>`
// ** without an email it uses the only training partner in the database
// ** a centre is only inserted when the partner has none with the same centre code, so re-running is safe
import mongoose from "mongoose";
import serverConfig from "../config/serverConfig.js";
import Center from "../models/Center.js";
import Scheme from "../models/Scheme.js";
import Sector from "../models/Sector.js";
import TrainingPartner from "../models/TrainingPartner.model.js";
import logger from "../utils/logger.js";

// ** placeholder until real sanction letters are uploaded
const SAMPLE_LETTER = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

// ** approved: true stands in for the SNA approval of that scheme (the SNA portal approves it normally)
const CENTRES = [
  {
    name: "Balasore Skill Centre",
    code: "BLS01",
    state: "Odisha",
    schemes: [
      { schemeName: "DAY-NULM", approved: true },
      { schemeName: "Corporate", approved: false },
    ],
  },
  {
    name: "Cuttack Training Hub",
    code: "CTC01",
    state: "Odisha",
    schemes: [
      { schemeName: "Skilled in Odisha", approved: true },
      { schemeName: "DAY-NULM", approved: true },
    ],
  },
  {
    name: "Bhubaneswar Skill Academy",
    code: "BBS01",
    state: "Odisha",
    schemes: [
      { schemeName: "DAY-NULM", approved: false },
      { schemeName: "Skilled in Odisha", approved: false },
    ],
  },
];

async function findTrainingPartner(email) {
  if (email) {
    const tp = await TrainingPartner.findOne({ registeredOfficeEmail: email.toLowerCase() });
    if (!tp) throw new Error(`no training partner with email ${email}`);
    return tp;
  }
  const partners = await TrainingPartner.find().limit(2);
  if (partners.length !== 1) {
    throw new Error(`found ${partners.length} training partners, pass the email: npm run seed:centres -- <email>`);
  }
  return partners[0];
}

async function seed() {
  await mongoose.connect(serverConfig.MONGO_URI);
  const tp = await findTrainingPartner(process.argv[2]);
  const knownSchemes = new Set((await Scheme.find({}, "name")).map((scheme) => scheme.name));
  // ** link the partner's own sectors so the centre offers its courses
  const sectors = await Sector.find({ name: { $in: tp.sector } }, "_id");

  let created = 0;
  for (const [index, centre] of CENTRES.entries()) {
    const centerId = `${tp.tpCode || "TP"}-${centre.code}`;
    const schemes = centre.schemes
      .filter((scheme) => knownSchemes.has(scheme.schemeName))
      .map((scheme) => ({ schemeName: scheme.schemeName, approveStatus: scheme.approved }));

    const result = await Center.updateOne(
      { trainingOrganizationId: tp._id, centerId },
      {
        $setOnInsert: {
          name: centre.name,
          state: centre.state,
          PRN_NO: `PRN-${centre.code}`,
          projectId: `PRJ-${String(index + 1).padStart(3, "0")}`,
          centerId,
          schemes,
          sectors: sectors.map((sector) => sector._id),
          sanction_order_letter: SAMPLE_LETTER,
          trainingOrganizationId: tp._id,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount) {
      await TrainingPartner.updateOne({ _id: tp._id }, { $addToSet: { centers: result.upsertedId } });
      created += 1;
      const summary = schemes.map((scheme) => `${scheme.schemeName}${scheme.approveStatus ? " (approved)" : " (pending)"}`).join(", ");
      logger.info(`created centre ${centre.name} [${centerId}]: ${summary}`);
    } else {
      logger.info(`centre ${centerId} already exists, left unchanged`);
    }
  }
  logger.info(`${created} centre(s) created for ${tp.organizationName}`);
}

seed()
  .catch((error) => {
    logger.error("seeding centres failed", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
