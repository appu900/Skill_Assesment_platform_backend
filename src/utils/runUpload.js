import AppError from "./AppError.js";

// ** run a multer middleware as a promise so upload errors reach the error handler
const runUpload = (uploader, req, res) =>
  new Promise((resolve, reject) => {
    uploader(req, res, (err) => {
      if (err) {
        return reject(new AppError(`File upload failed: ${err.message}`));
      }
      resolve();
    });
  });

export default runUpload;
