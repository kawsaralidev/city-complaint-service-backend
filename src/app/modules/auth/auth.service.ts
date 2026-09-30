import bcrypt from "bcryptjs";

import { prisma } from "../../lib/prisma";
import { compareOtp, generateOtp, hashOtp } from "../../utils/otp";
import { AppError } from "../../utils/AppError";
import { HttpStatus } from "../../../constants/httpStatus";
import config from "../../config/index";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import type { IRegisterPayload, IVerifyEmailPayload } from "./auth.interface";
import { jwtUtils } from "../../utils/jwt";
import type { SignOptions } from "jsonwebtoken";

// Register User
const register = async (
  payload: IRegisterPayload,
): Promise<{
  email: string;
  message: string;
}> => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  // Check if user already exists
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Allow credential setup for an existing Google-only account
  if (isUserExists && isUserExists.googleId && !isUserExists.password) {
    // Generate OTP
    const otp = generateOtp();

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    // Hash OTP before storing it in Redis
    const hashedOtp = hashOtp(otp);

    // Redis key for registration OTP
    const otpKey = `registration-otp:${email}`;

    // Redis key for temporary registration data
    const registrationDataKey = `registration-data:${email}`;

    // Temporary credential linking data
    const registrationData = {
      name: isUserExists.name,
      email,
      password: hashedPassword,
      userId: isUserExists.id,
      mode: "LINK_CREDENTIAL",
    };

    // Store hashed OTP in Redis for 5 minutes
    await redisClient.set(otpKey, hashedOtp, {
      EX: 300,
    });

    // Store temporary credential linking data in Redis for 5 minutes
    await redisClient.set(
      registrationDataKey,
      JSON.stringify(registrationData),
      {
        EX: 300,
      },
    );

    // Send OTP to user's email
    await transporter.sendMail({
      from: `"City Complaint Service" <${config.smtp_user}>`,
      to: email,
      subject: "Email Verification - City Complaint Service",
      html: `
        <h2>Email Verification</h2>

        <p>Hello ${isUserExists.name},</p>

        <p>
          Your OTP for setting up credential login is:
        </p>

        <h1>${otp}</h1>

        <p>
          This OTP will expire in 5 minutes.
        </p>

        <p>
          If you did not request this, please ignore this email.
        </p>
      `,
    });

    return {
      email,
      message: "OTP sent successfully. Please verify your email.",
    };
  }

  // Reject registration if another user already exists
  if (isUserExists) {
    throw new AppError(
      HttpStatus.CONFLICT,
      "User with this email already exists.",
    );
  }

  // Generate OTP
  const otp = generateOtp();

  // Hash password
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  // Hash OTP before storing it in Redis
  const hashedOtp = hashOtp(otp);

  // Redis key for registration OTP
  const otpKey = `registration-otp:${email}`;

  // Redis key for temporary registration data
  const registrationDataKey = `registration-data:${email}`;

  // Temporary registration data
  const registrationData = {
    name,
    email,
    password: hashedPassword,
    mode: "REGISTER",
  };

  // Store hashed OTP in Redis for 5 minutes
  await redisClient.set(otpKey, hashedOtp, {
    EX: 300,
  });

  // Store temporary registration data in Redis for 5 minutes
  await redisClient.set(registrationDataKey, JSON.stringify(registrationData), {
    EX: 300,
  });

  // Send OTP to user's email
  await transporter.sendMail({
    from: `"City Complaint Service" <${config.smtp_user}>`,
    to: email,
    subject: "Email Verification - City Complaint Service",
    html: `
      <h2>Email Verification</h2>

      <p>Hello ${name},</p>

      <p>
        Your registration OTP is:
      </p>

      <h1>${otp}</h1>

      <p>
        This OTP will expire in 5 minutes.
      </p>

      <p>
        If you did not request this registration, please ignore this email.
      </p>
    `,
  });

  return {
    email,
    message: "Registration OTP sent successfully.",
  };
};

// Verify Registration Email
const verifyRegisterEmail = async (payload: IVerifyEmailPayload) => {
  const email = payload.email.trim().toLowerCase();
  const { otp } = payload;

  // Redis key for registration OTP
  const otpKey = `registration-otp:${email}`;

  // Redis key for temporary registration data
  const registrationDataKey = `registration-data:${email}`;

  // Get the hashed OTP from Redis
  const hashedOtp = await redisClient.get(otpKey);

  // Throw an error if OTP is missing or expired
  if (!hashedOtp) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "OTP has expired. Please request a new OTP.",
    );
  }

  // Compare the submitted OTP with the hashed OTP
  const isOtpValid = compareOtp(otp, hashedOtp);

  // Throw an error if the OTP is incorrect
  if (!isOtpValid) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Invalid OTP. Please provide a valid OTP.",
    );
  }

  // Get temporary registration data from Redis
  const registrationData = await redisClient.get(registrationDataKey);

  // Throw an error if registration data is missing or expired
  if (!registrationData) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Registration session expired. Please register again.",
    );
  }

  // Parse temporary registration data
  const parsedData = JSON.parse(registrationData) as {
    name: string;
    email: string;
    password: string;
    userId?: string;
    mode?: "REGISTER" | "LINK_CREDENTIAL";
  };

  // Handle existing Google account credential linking
  if (parsedData.mode === "LINK_CREDENTIAL") {
    // Find the existing Google user
    const user = await prisma.user.findUnique({
      where: {
        id: parsedData.userId,
      },
    });

    // Throw an error if the Google user no longer exists
    if (!user) {
      await redisClient.del(otpKey);
      await redisClient.del(registrationDataKey);

      throw new AppError(
        HttpStatus.NOT_FOUND,
        "User account not found. Please register again.",
      );
    }

    // Update the existing Google account with password
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: parsedData.password,
      },
    });

    // Create access token
    const accessToken = jwtUtils.createToken(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions["expiresIn"],
    );

    // Create refresh token
    const refreshToken = jwtUtils.createToken(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions["expiresIn"],
    );

    // Remove OTP and temporary registration data from Redis
    await redisClient.del(otpKey);
    await redisClient.del(registrationDataKey);

    return {
      accessToken,
      refreshToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        emailVerified: updatedUser.emailVerified,
        googleId: updatedUser.googleId,
      },
      message: "Email verified and credential login linked successfully.",
    };
  }

  // Check if user already exists
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Throw an error if user already exists
  if (isUserExists) {
    // Remove temporary registration data from Redis
    await redisClient.del(otpKey);
    await redisClient.del(registrationDataKey);

    throw new AppError(
      HttpStatus.CONFLICT,
      "User with this email already exists.",
    );
  }

  // Create the verified citizen in PostgreSQL
  const user = await prisma.user.create({
    data: {
      name: parsedData.name,
      email: parsedData.email,
      password: parsedData.password,
      role: "CITIZEN",
      status: "ACTIVE",
      authProvider: "CREDENTIALS",
      emailVerified: true,
    },
  });

  // Create access token
  const accessToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions["expiresIn"],
  );

  // Create refresh token
  const refreshToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions["expiresIn"],
  );

  // Remove OTP and temporary registration data from Redis
  await redisClient.del(otpKey);
  await redisClient.del(registrationDataKey);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
    },
    message: "Email verified and registration completed successfully.",
  };
};

// Login User
const login = async (payload: { email: string; password: string }) => {
  const email = payload.email.trim().toLowerCase();
  const { password } = payload;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Throw an error if user does not exist
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  // Check if user account is deleted
  if (user.deletedAt) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Your account is no longer available.",
    );
  }

  // Check if user account is blocked
  if (user.status === "BLOCKED") {
    throw new AppError(HttpStatus.FORBIDDEN, "Your account has been blocked.");
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Please verify your email before logging in.",
    );
  }

  // Check if user has a password
  if (!user.password) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  // Compare the provided password with the hashed password
  const isPasswordMatched = await bcrypt.compare(password, user.password);

  // Throw an error if password is incorrect
  if (!isPasswordMatched) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  // Create access token
  const accessToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions["expiresIn"],
  );

  // Create refresh token
  const refreshToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions["expiresIn"],
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      imageUrl: user.imageUrl,
    },
  };
};

// Demo Login
const demoLogin = async (role: "CITIZEN" | "OFFICER" | "ADMIN") => {
  const demoEmailMap = {
    CITIZEN: config.demo_citizen_email,
    OFFICER: config.demo_officer_email,
    ADMIN: config.demo_admin_email,
  };

  const demoEmail = demoEmailMap[role];

  if (!demoEmail) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Demo account is not configured.",
    );
  }

  // Find the configured demo user
  const user = await prisma.user.findUnique({
    where: {
      email: demoEmail,
    },
  });

  // Make sure the configured demo account exists
  if (!user) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Demo account not found.",
    );
  }

  // Make sure the database role matches the requested demo role
  if (user.role !== role) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Demo account role configuration is invalid.",
    );
  }

  // Check if user account is deleted
  if (user.deletedAt) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "This demo account is no longer available.",
    );
  }

  // Check if user account is blocked
  if (user.status === "BLOCKED") {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "This demo account has been blocked.",
    );
  }

  // Create access token
  const accessToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions["expiresIn"],
  );

  // Create refresh token
  const refreshToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions["expiresIn"],
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      imageUrl: user.imageUrl,
    },
  };
};

// Google Login
const googleLogin = async (userId: string) => {
  // Find authenticated Google user
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  // Throw an error if user does not exist
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "User not found.");
  }

  // Check if user account is deleted
  if (user.deletedAt) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Your account is no longer available.",
    );
  }

  // Check if user account is blocked
  if (user.status === "BLOCKED") {
    throw new AppError(HttpStatus.FORBIDDEN, "Your account has been blocked.");
  }

  // Create access token
  const accessToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions["expiresIn"],
  );

  // Create refresh token
  const refreshToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions["expiresIn"],
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      imageUrl: user.imageUrl,
    },
  };
};

// Refresh Access Token
const refreshAccessToken = async (refreshToken: string) => {
  // Throw an error if refresh token is missing
  if (!refreshToken) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Refresh token is required.");
  }

  // Verify the refresh token
  const verifiedToken = jwtUtils.verifyToken(
    refreshToken,
    config.jwt_refresh_secret,
  );

  // Throw an error if refresh token is invalid or expired
  if (!verifiedToken.success) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Invalid or expired refresh token.",
    );
  }

  // Get user information from the verified token
  const payload = verifiedToken.data as {
    userId: string;
    email: string;
    role: string;
  };

  // Check if the user still exists
  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  // Throw an error if user does not exist
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "User not found.");
  }

  // Check if user account is deleted
  if (user.deletedAt) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Your account is no longer available.",
    );
  }

  // Check if user account is blocked
  if (user.status === "BLOCKED") {
    throw new AppError(HttpStatus.FORBIDDEN, "Your account has been blocked.");
  }

  // Create a new access token
  const accessToken = jwtUtils.createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions["expiresIn"],
  );

  return {
    accessToken,
  };
};

// Get Current User
const getCurrentUser = async (userId: string) => {
  // Find the authenticated user in the database
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  // Throw an error if user does not exist
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
  }

  // Check if user account is deleted
  if (user.deletedAt) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Your account is no longer available.",
    );
  }

  // Check if user account is blocked
  if (user.status === "BLOCKED") {
    throw new AppError(HttpStatus.FORBIDDEN, "Your account has been blocked.");
  }

  // Return current user information
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    authProvider: user.authProvider,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const hashResetToken = async (token: string) => {
  const hashBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Forgot Password
const forgotPassword = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  // Do not reveal whether an email exists or not
  if (!user || user.deletedAt || user.status === "BLOCKED") {
    return {
      message:
        "If an account exists with this email, a password reset link has been sent.",
    };
  }

  // Generate a secure random reset token
  const randomBytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(randomBytes);

  const resetToken = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const hashedToken = await hashResetToken(resetToken);

  const resetTokenKey = `password-reset:${hashedToken}`;

  // Store user ID in Redis for 15 minutes
  await redisClient.set(resetTokenKey, user.id, {
    EX: 900,
  });

  // Reset password link
  const resetLink = `${config.frontend_url}/reset-password?token=${resetToken}`;

  // Send reset link to user's email
  await transporter.sendMail({
    from: `"City Complaint Service" <${config.smtp_user}>`,
    to: normalizedEmail,
    subject: "Reset Your Password - City Complaint Service",
    html: `
      <h2>Password Reset Request</h2>

      <p>Hello ${user.name},</p>

      <p>
        We received a request to reset your password.
      </p>

      <p>
        Click the button below to create a new password:
      </p>

      <p>
        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>
      </p>

      <p>
        This password reset link will expire in 15 minutes.
      </p>

      <p>
        If you did not request a password reset, you can safely ignore this email.
      </p>
    `,
  });

  return {
    message:
      "If an account exists with this email, a password reset link has been sent.",
  };
};

const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = await hashResetToken(token);

  const resetTokenKey = `password-reset:${hashedToken}`;

  const userId = await redisClient.get(resetTokenKey);

  if (!userId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Password reset link is invalid or expired.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Password reset link is invalid or expired.",
    );
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  // Make the reset token unusable after successful password reset
  await redisClient.del(resetTokenKey);

  return null;
};

export const authService = {
  register,
  verifyRegisterEmail,
  login,
  demoLogin,
  googleLogin,
  refreshAccessToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
