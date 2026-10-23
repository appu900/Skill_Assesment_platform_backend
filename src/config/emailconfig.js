import nodemailer from "nodemailer";
import serverConfig from "./serverConfig.js";

const sender = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: serverConfig.EMAIL_ID,
    pass: serverConfig.EMAIL_PASSWORD,
  },
});

export default sender;
