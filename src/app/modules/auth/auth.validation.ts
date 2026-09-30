import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),

    email: z.email("Please provide a valid email address").trim().toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),

      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
          /[^A-Za-z0-9]/,
          "Password must contain at least one special character",
        ),

      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New password and confirm password do not match",
      path: ["confirmPassword"],
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

export const demoLoginSchema = z.object({
  body: z.object({
    role: z.enum(["CITIZEN", "OFFICER", "ADMIN"]),
  }),
});
