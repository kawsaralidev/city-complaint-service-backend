import bcrypt from "bcryptjs";

import { prisma } from "../../lib/prisma";
import { compareOtp, generateOtp, hashOtp } from "../../utils/otp";
import { AppError } from "../../utils/AppError";
import { HttpStatus } from "../../../constants/httpStatus";
import config from "../../config/index";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { IRegisterPayload, IVerifyEmailPayload } from "./auth.interface";

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

export const authService = {
  register,
  verifyRegisterEmail,
};
