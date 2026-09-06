import rateLimit from "express-rate-limit";

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    errors: [],
  },
});
