import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import { isPrivateModuleKey, keyFromUrl, signedViewUrl } from "../utils/s3Files.js";

// ** GET /v1/files/view?url=<stored file url>: a logged in user is redirected to a 5 minute signed link.
// ** works for <a href> and <img src> because the frontend proxy adds the session token
export const viewFile = asyncHandler(async (req, res) => {
  const key = keyFromUrl(req.query.url);
  if (!key || isPrivateModuleKey(key)) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "file not found", error: "FileNotFound" });
  }
  res.setHeader("Cache-Control", "private, no-store");
  return res.redirect(StatusCodes.MOVED_TEMPORARILY, await signedViewUrl(key));
});
