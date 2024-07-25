import { createChannel, publishMessage } from "../config/messageQueue.js";

const sendMessages = async (req, res) => {
  try {
    const channel = await createChannel();
    const payload = {
      data: {
        name: "Appu",
      },
      service: "CREATE_CERTIFICATE",
    };

    await publishMessage(
      channel,
      "CREATE_CERTIFICATE",
      JSON.stringify(payload)
    );
    return res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default sendMessages;
