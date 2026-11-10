import ToaNotification from "../../models/toa/ToaNotification.model.js";
import sendEmail from "../email-service.js";
import serverConfig from "../../config/serverConfig.js";
import logger from "../../utils/logger.js";

const SENDER_EMAIL = "awardingbody@cutm.ac.in";

// ** on-portal notification + the same text by email; a failure here never breaks the action itself
export async function notify({ role, id, email, title, message, link = null }) {
  try {
    await ToaNotification.create({ recipientRole: role, recipientId: id, title, message, link });
    if (email) {
      await sendEmail(SENDER_EMAIL, email, title, `${message}${link ? `\n\nOpen the portal: ${serverConfig.FRONTEND_URL}${link}` : ""}\n\nCUTM Awarding Body`);
    }
  } catch (error) {
    logger.error("toa notification failed", error.message);
  }
}

export async function listNotifications(role, id) {
  const [items, unread] = await Promise.all([
    ToaNotification.find({ recipientRole: role, recipientId: id }).sort({ createdAt: -1 }).limit(50).lean(),
    ToaNotification.countDocuments({ recipientRole: role, recipientId: id, readAt: null }),
  ]);
  return { items, unread };
}

export async function markRead(role, id, notificationId) {
  const query = { recipientRole: role, recipientId: id, readAt: null };
  if (notificationId !== "all") query._id = notificationId;
  await ToaNotification.updateMany(query, { readAt: new Date() });
  return true;
}
