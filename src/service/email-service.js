import { emailQueue, JOB_NAMES } from "../queues/index.js";
import logger from "../utils/logger.js";

// ** emails are sent by the email worker, so a slow or failing smtp server never blocks an api request
const sendEmail = async (from, to, subject, mailbody) => {
  try {
    if (!to) {
      return;
    }
    await emailQueue.add(JOB_NAMES.SEND_EMAIL, { from, to, subject, text: mailbody });
  } catch (error) {
    logger.error("Error in queueing email", error.message);
  }
};

export default sendEmail;
