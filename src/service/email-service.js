import sender from "../config/emailconfig.js";

const sendEmail = async (from, to, subject, mailbody) => {
  try {
    const response = await sender.sendMail({
      from: from,
      to: to,
      subject: subject,
      text: mailbody,
    });
    console.log("Email Sent Successfully", response);
  } catch (error) {
    console.log("Error in Sending Email", error.message);
  }
};


export default sendEmail;