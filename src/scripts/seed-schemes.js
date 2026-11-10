// ** seeds the starting schemes: `npm run seed:schemes`
// ** a scheme is only inserted when none with the same name exists, so re-running never overwrites admin changes
import mongoose from "mongoose";
import serverConfig from "../config/serverConfig.js";
import Scheme from "../models/Scheme.js";
import logger from "../utils/logger.js";

// ** placeholder logos until real ones are uploaded; pricePerStudent values are starting points, adjust per agreement
const logo = (text) => `https://placehold.co/240x240/1e3a8a/ffffff/png?text=${encodeURIComponent(text)}`;

const SCHEMES = [
  {
    name: "PMKVY 4.0",
    code: "PMKVY4",
    schemeType: "Central Government",
    projectType: "Short Term Training",
    state: "All India",
    pricePerStudent: 600,
    logo: logo("PMKVY"),
  },
  {
    name: "DDU-GKY",
    code: "DDUGKY",
    schemeType: "Central Government",
    projectType: "Placement Linked Training",
    state: "All India",
    pricePerStudent: 800,
    logo: logo("DDU-GKY"),
  },
  {
    name: "DAY-NULM",
    code: "DAYNULM",
    schemeType: "Central Government",
    projectType: "Employment through Skill Training & Placement",
    state: "All India",
    pricePerStudent: 600,
    logo: logo("NULM"),
  },
  {
    name: "Skilled in Odisha",
    code: "OSDA",
    schemeType: "State Government",
    projectType: "Short Term Training",
    state: "Odisha",
    pricePerStudent: 700,
    logo: logo("OSDA"),
  },
  {
    name: "Corporate",
    code: "CORP",
    schemeType: "Corporate",
    projectType: "Corporate Training",
    state: "All India",
    // ** corporate batches use the per candidate fee set on each training partner instead
    pricePerStudent: 0,
    logo: logo("CORP"),
  },
];

async function seed() {
  await mongoose.connect(serverConfig.MONGO_URI);
  let created = 0;
  for (const scheme of SCHEMES) {
    const result = await Scheme.updateOne({ name: scheme.name }, { $setOnInsert: scheme }, { upsert: true });
    if (result.upsertedCount) {
      created += 1;
      logger.info(`created scheme ${scheme.name}`);
    } else {
      logger.info(`scheme ${scheme.name} already exists, left unchanged`);
    }
  }
  logger.info(`${created} scheme(s) created, ${SCHEMES.length - created} already present`);
}

seed()
  .catch((error) => {
    logger.error("seeding schemes failed", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
