import crypto from "crypto";
import path from "path";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import serverConfig from "./serverConfig.js";

const s3 = new S3Client({
  region: serverConfig.AWS_REGION,
  credentials: {
    accessKeyId: serverConfig.AWS_ACCESS_KEY_ID,
    secretAccessKey: serverConfig.AWS_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: serverConfig.AWS_BUCKET_NAME,
    acl: serverConfig.S3_OBJECT_ACL,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    // ** random key + original extension, Date.now() alone collides when several files arrive in one request
    key: (req, file, cb) => {
      const extension = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: serverConfig.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPEG, PNG, and PDF are allowed!"), false);
    }
  },
});

export default upload;
