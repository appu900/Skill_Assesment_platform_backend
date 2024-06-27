const EMAIL_ID = "pabitrasundardakua@gmail.com";
const EMAIL_PASSWORD = "mfiwunmmuvutigyf";

import nodemailer from "nodemailer";

const sender = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_ID,
    pass: EMAIL_PASSWORD,
  },
});

export default sender;
