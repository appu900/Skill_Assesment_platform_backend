import upload from "../config/s3-imageUpload-config.js";

const singleUploader = upload.single("image");

// ** upload image middleware

async function uploadImage(req, res, next) {
  try {
    singleUploader(req, res, async function (err) {
      if (err) {
        return res.status(500).json({ message: "something went wrong" });
      }
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: "something went wrong" });
  }
}

export default uploadImage;
