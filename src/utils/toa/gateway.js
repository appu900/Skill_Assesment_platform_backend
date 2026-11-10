import crypto from "crypto";
import serverConfig from "../../config/serverConfig.js";
import AppError from "../AppError.js";

const hmac = (secret, text) => crypto.createHmac("sha256", secret).update(text).digest("hex");
const sameText = (a, b) => typeof a === "string" && typeof b === "string" && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// ** razorpay over its REST api (no sdk): orders, payment lookup, refunds and signature checks
const razorpay = {
  name: "razorpay",
  async call(method, path, body) {
    const auth = Buffer.from(`${serverConfig.RAZORPAY_KEY_ID}:${serverConfig.RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (!response?.ok) throw new AppError(`payment gateway error: ${payload?.error?.description ?? "not reachable"}`, 502);
    return payload;
  },
  publicKey: () => serverConfig.RAZORPAY_KEY_ID,
  async createOrder({ amountPaise, receipt, notes }) {
    const order = await this.call("POST", "/orders", { amount: amountPaise, currency: "INR", receipt, notes });
    return { orderId: order.id };
  },
  checkoutSignatureValid: (orderId, paymentId, signature) => sameText(hmac(serverConfig.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature),
  // ** server-side confirmation: never trust the browser alone
  async fetchPayment(paymentId) {
    const payment = await this.call("GET", `/payments/${encodeURIComponent(paymentId)}`);
    return { orderId: payment.order_id, amountPaise: payment.amount, status: payment.status, method: payment.method };
  },
  async refund(paymentId, amountPaise) {
    const refund = await this.call("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise });
    return { refundId: refund.id };
  },
  webhookSignatureValid: (rawBody, signature) => Boolean(serverConfig.RAZORPAY_WEBHOOK_SECRET && rawBody) && sameText(hmac(serverConfig.RAZORPAY_WEBHOOK_SECRET, rawBody), signature),
};

// ** development stand-in that behaves like razorpay (same signature scheme, secret derived from JWT_SECRET)
const MOCK_SECRET = hmac(serverConfig.JWT_SECRET, "toa-mock-gateway");
const mockOrders = new Map();
const mock = {
  name: "mock",
  publicKey: () => "mock",
  async createOrder({ amountPaise }) {
    const orderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    mockOrders.set(orderId, amountPaise);
    return { orderId };
  },
  // ** what the checkout popup would hand back to the browser
  complete(orderId) {
    const paymentId = `pay_mock_${crypto.randomBytes(8).toString("hex")}`;
    return { orderId, paymentId, signature: hmac(MOCK_SECRET, `${orderId}|${paymentId}`) };
  },
  checkoutSignatureValid: (orderId, paymentId, signature) => sameText(hmac(MOCK_SECRET, `${orderId}|${paymentId}`), signature),
  async fetchPayment(paymentId, orderId) {
    return { orderId, amountPaise: mockOrders.get(orderId), status: "captured", method: "upi" };
  },
  async refund() {
    return { refundId: `rfnd_mock_${crypto.randomBytes(6).toString("hex")}` };
  },
  webhookSignatureValid: (rawBody, signature) => Boolean(rawBody) && sameText(hmac(MOCK_SECRET, rawBody), signature),
  signWebhook: (rawBody) => hmac(MOCK_SECRET, rawBody),
};

export function gateway() {
  if (serverConfig.TOA_PAYMENT_GATEWAY === "razorpay") {
    if (!serverConfig.RAZORPAY_KEY_ID || !serverConfig.RAZORPAY_KEY_SECRET) throw new AppError("online payment is not configured yet", 503);
    return razorpay;
  }
  if (serverConfig.NODE_ENV === "production") throw new AppError("online payment is not configured yet", 503);
  return mock;
}

export const gatewayByName = (name) => (name === "razorpay" ? razorpay : mock);
