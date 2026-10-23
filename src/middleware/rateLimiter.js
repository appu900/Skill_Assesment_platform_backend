import rateLimit from "express-rate-limit";

// ** brute force protection for login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

export { loginLimiter };
