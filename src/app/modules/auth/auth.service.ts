import bcrypt from "bcryptjs";

import { prisma } from "../../lib/prisma";
import { compareOtp, generateOtp, hashOtp } from "../../utils/otp";
import { AppError } from "../../utils/AppError";
import { HttpStatus } from "../../../constants/httpStatus";
import config from "../../config/index";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { IRegisterPayload, IVerifyEmailPayload } from "./auth.interface";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";

// Register User
const register = async (payload: IRegisterPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  // Check if user already exists
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

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
  };

  // Check if user already exists
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

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

  // Remove OTP and temporary registration data from Redis
  await redisClient.del(otpKey);
  await redisClient.del(registrationDataKey);

  return {
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

export const authService = {
  register,
  verifyRegisterEmail,
  login,
  refreshAccessToken,
  getCurrentUser,
};
