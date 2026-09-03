import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),

    email: z.email("Please provide a valid email address").trim().toLowerCase(),

    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const verifyRegistrationSchema = z.object({
  body: z.object({
    email: z.email("Please provide a valid email address").trim().toLowerCase(),

    otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
  }),
});

export const resendRegistrationOtpSchema = z.object({
  body: z.object({
    email: z.email("Please provide a valid email address").trim().toLowerCase(),
  }),
});

// Login Validation
export const loginSchema = z.object({
  body: z.object({
    email: z.email("Please provide a valid email address").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});
