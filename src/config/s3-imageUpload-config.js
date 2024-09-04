/**
 * aws sdk
 * multer
 */

import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import 'dotenv/config';

// ** aws configuration

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_REGION,
});

const s3 = new aws.S3();

const upload = multer({
    storage:multerS3({
        s3:s3,
        bucket:process.env.AWS_BUCKET_NAME,
        acl:'public-read',
        contentType:multerS3.AUTO_CONTENT_TYPE,
        metadata:(req,file,cb)=>{
            cb(null,{fieldName:file.fieldname})
        },
        key:(req,file,cb)=>{
            cb(null,Date.now().toString())
        }
    }),
    fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'image/jpeg' ||
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg' ||
          file.mimetype === 'application/pdf'
        ) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type, only JPEG, PNG, and PDF are allowed!'), false);
        }
      }

});

export default upload;
