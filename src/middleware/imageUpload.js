import upload from "../config/s3-imageUpload-config.js";
import runUpload from "../utils/runUpload.js";

const singleUploader = upload.single("image");

// ** upload image middleware
async function uploadImage(req, res, next) {
  try {
    await runUpload(singleUploader, req, res);
    next();
  } catch (error) {
    next(error);
  }
}

export default uploadImage;
