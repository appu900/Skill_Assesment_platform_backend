import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import ToaTemplate from "../../models/toa/ToaTemplate.model.js";
import logger from "../logger.js";

const TEMPLATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../templates/toa");

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const lookup = (data, key) => key.split(".").reduce((value, part) => (value == null ? undefined : value[part]), data);

// ** tiny mustache: {{field}} (always escaped) and {{#list}}...{{/list}} for rows; nothing can inject markup or script
export function fillTemplate(html, data) {
  const withSections = html.replace(/{{#([\w.]+)}}([\s\S]*?){{\/\1}}/g, (match, key, inner) => {
    const list = lookup(data, key);
    if (Array.isArray(list)) return list.map((item, index) => fillTemplate(inner, { ...data, ...item, index: index + 1 })).join("");
    return list ? fillTemplate(inner, data) : "";
  });
  return withSections.replace(/{{\s*([\w.]+)\s*}}/g, (match, key) => escapeHtml(lookup(data, key)));
}

export const builtInTemplate = (type) => fs.readFileSync(path.join(TEMPLATE_DIR, `${type}.html`), "utf8");

// ** the partner's own template, else the general one, else the built-in file
export async function templateHtml(type, partner = null) {
  // ** callers may pass a populated partner document or just its id
  const toaTpId = partner?._id ?? partner;
  const custom = await ToaTemplate.find({ type, toaTpId: { $in: toaTpId ? [toaTpId, null] : [null] } }).lean();
  const own = toaTpId && custom.find((row) => String(row.toaTpId) === String(toaTpId));
  return (own ?? custom.find((row) => row.toaTpId === null))?.html ?? builtInTemplate(type);
}

export const qrDataUrl = (text) => QRCode.toDataURL(text, { margin: 1, width: 240 });

let browserPromise = null;
async function browser() {
  if (!browserPromise) {
    const { default: puppeteer } = await import("puppeteer");
    browserPromise = puppeteer
      .launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] })
      .then((instance) => {
        // ** a crashed or closed Chrome is replaced on the next render instead of failing every PDF from then on
        instance.on("disconnected", () => {
          browserPromise = null;
        });
        return instance;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }
  return browserPromise;
}

const isBrowserGone = (error) => /Connection closed|Target closed|Session closed|browser has disconnected|Protocol error/i.test(error?.message ?? "");

// ** html -> pdf; scripts are off and the page may not load anything from the network (only data: urls)
export async function htmlToPdf(html, options = {}, retried = false) {
  try {
    return await renderOnce(html, options);
  } catch (error) {
    if (retried || !isBrowserGone(error)) throw error;
    logger.warn(`pdf browser was gone (${error.message}); starting a new one`);
    const stale = browserPromise;
    browserPromise = null;
    await stale?.then((instance) => instance.close()).catch(() => {});
    return htmlToPdf(html, options, true);
  }
}

async function renderOnce(html, { landscape = false } = {}) {
  const page = await (await browser()).newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => (request.url().startsWith("data:") || request.url() === "about:blank" ? request.continue() : request.abort()));
    await page.setContent(html, { waitUntil: "load", timeout: 15000 });
    // ** a template's own @page size wins (e.g. an ID card), A4 otherwise
    return Buffer.from(await page.pdf({ format: "A4", landscape, printBackground: true, preferCSSPageSize: true, margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" } }));
  } finally {
    await page.close().catch((error) => logger.warn("pdf page close failed", error.message));
  }
}

// ** options.toaTpId picks that training partner's template
export async function renderPdf(type, data, { toaTpId = null, ...options } = {}) {
  return htmlToPdf(fillTemplate(await templateHtml(type, toaTpId), data), options);
}

export async function closeRenderer() {
  if (browserPromise) await (await browserPromise).close().catch(() => {});
  browserPromise = null;
}
