import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import serverConfig from "../config/serverConfig.js";
import { s3 } from "../config/s3-imageUpload-config.js";

// ** stored file urls point at a private bucket: they are only opened through short-lived signed links
export const VIEW_LINK_SECONDS = 300;
// ** ToA and offline documents have their own, stricter link endpoints
const PRIVATE_PREFIXES = ["toa/", "offline/"];

// ** object key of a url in our bucket (virtual-hosted, path-style or custom endpoint), null for anything else
export function keyFromUrl(url) {
  if (typeof url !== "string" || !/^https?:\/\//.test(url)) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const bucket = serverConfig.AWS_BUCKET_NAME;
  const path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  let key = null;
  if (parsed.hostname.startsWith(`${bucket}.s3.`) || parsed.hostname === `${bucket}.s3.amazonaws.com`) key = path;
  else if (path.startsWith(`${bucket}/`) && (parsed.hostname.startsWith("s3.") || (serverConfig.AWS_S3_ENDPOINT && url.startsWith(serverConfig.AWS_S3_ENDPOINT)))) key = path.slice(bucket.length + 1);
  if (!key || key.includes("..")) return null;
  return key;
}

export const isPrivateModuleKey = (key) => PRIVATE_PREFIXES.some((prefix) => key.startsWith(prefix));

export function signedViewUrl(key) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: serverConfig.AWS_BUCKET_NAME, Key: key }), { expiresIn: VIEW_LINK_SECONDS });
}

// ** the object itself (for embedding images in PDFs on the server)
export async function readObject(key) {
  const object = await s3.send(new GetObjectCommand({ Bucket: serverConfig.AWS_BUCKET_NAME, Key: key }));
  return { type: object.ContentType ?? "", bytes: Buffer.from(await object.Body.transformToByteArray()) };
}
