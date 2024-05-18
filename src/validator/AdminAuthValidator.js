import vine from "@vinejs/vine";
import { CustomErrorReporter } from "./customErrorReporter.js";

// ** custome error reporter
vine.errorReporter = () => new CustomErrorReporter();

export const adminAuthSchema = vine.object({
  name: vine.string().minLength(4).maxLength(150),
  email: vine.string().email(),
  password: vine.string().minLength(6).maxLength(32),
});
