const EMAIL_ID = "awardingbody@cutm.ac.in";
// const EMAIL_PASSWORD = "mfiwunmmuvutigyf";
const EMAIL_PASSWORD = "wwut qszt cvxj njly";
import nodemailer from "nodemailer";
const password = "wwut qszt cvxj njly";

const sender = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_ID,
    pass: EMAIL_PASSWORD,
  },
});

export default sender;
