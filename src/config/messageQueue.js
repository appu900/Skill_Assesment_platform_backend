import amqplib from "amqplib";
import dotenv from "dotenv";
dotenv.config();

const exchnageName = process.env.EXCHANGE_NAME;
const messageBrokerUrl = process.env.MESSAGE_BROKER_URL;

const createChannel = async () => {
  try {
    const connection = await amqplib.connect(messageBrokerUrl);
    const channel = await connection.createChannel();
    await channel.assertExchange(exchnageName, "direct", { durable: true });
    return channel;
  } catch (error) {
    throw error;
  }
};

const publishMessage = async ( channel,binding_key,message) =>{
  try {
     await channel.assertQueue("AssesmentQueue")
     await channel.publish(exchnageName, binding_key, Buffer.from(message));
  } catch (error) {
    console.log("error occured in publishMessage",error);
    throw error
  }
}


export {createChannel,publishMessage}