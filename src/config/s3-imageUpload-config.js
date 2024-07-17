/**
 * aws sdk
 * multer
 */

import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_REGION,
});
