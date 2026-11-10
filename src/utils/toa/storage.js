import crypto from "crypto";
import path from "path";
import multer from "multer";
import multerS3 from "multer-s3";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import serverConfig from "../../config/serverConfig.js";
import AppError from "../AppError.js";

// ** ToA files are private objects under toa/<tpId>/...; clients only ever get short-lived signed links
const s3 = new S3Client({
  region: serverConfig.AWS_REGION,
  credentials: { accessKeyId: serverConfig.AWS_ACCESS_KEY_ID, secretAccessKey: serverConfig.AWS_SECRET_ACCESS_KEY },
  ...(serverConfig.AWS_S3_ENDPOINT && { endpoint: serverConfig.AWS_S3_ENDPOINT, forcePathStyle: true }),
});

const ALLOWED = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "application/pdf": [".pdf"] };
const SIGNED_LINK_SECONDS = 300;

// ** multer storing private objects under the key prefix the request maps to
export const privateUploader = (prefixOf) =>
  multer({
    storage: multerS3({
      s3,
      bucket: serverConfig.AWS_BUCKET_NAME,
      acl: "private",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const extension = path.extname(file.originalname || "").toLowerCase();
        cb(null, `${prefixOf(req)}/${crypto.randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: serverConfig.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 6 },
    fileFilter: (req, file, cb) => {
      const extension = path.extname(file.originalname || "").toLowerCase();
      if (ALLOWED[file.mimetype]?.includes(extension)) return cb(null, true);
      cb(new Error("only JPG, PNG and PDF files are allowed"), false);
    },
  });

// ** ToA upload of one kind; the owning TP id must already be on req.toaTpId
export const toaUploader = (kind) => privateUploader((req) => `toa/${req.toaTpId}/${kind}`);

// ** offline wing uploads (admin only), e.g. offline/assessors, offline/batches/<id>
export const offlineUploader = (kind) => privateUploader(() => `offline/${kind}`);

// ** admin-only link to an offline wing file
export async function offlineSignedLink(key) {
  if (!key || typeof key !== "string" || !key.startsWith("offline/") || key.includes("..")) throw new AppError("invalid file");
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: serverConfig.AWS_BUCKET_NAME, Key: key }), { expiresIn: SIGNED_LINK_SECONDS });
}

// ** a stored image as a data: url, so PDFs can show it without loading anything from the network
export async function imageDataUrl(key) {
  if (!key) return "";
  try {
    const object = await s3.send(new GetObjectCommand({ Bucket: serverConfig.AWS_BUCKET_NAME, Key: key }));
    const bytes = Buffer.from(await object.Body.transformToByteArray());
    return `data:${object.ContentType || "image/jpeg"};base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

// ** a training partner may only open its own files; the admin any ToA file
export async function signedLink(key, { tpId, isAdmin }) {
  if (!key || typeof key !== "string" || !key.startsWith("toa/") || key.includes("..")) throw new AppError("invalid file");
  if (!isAdmin && !key.startsWith(`toa/${tpId}/`)) throw AppError.forbidden("You cannot open this file");
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: serverConfig.AWS_BUCKET_NAME, Key: key }), { expiresIn: SIGNED_LINK_SECONDS });
}
