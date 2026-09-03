import crypto from "node:crypto";

export const generateOtp = (): string => {
  const otp = crypto.randomInt(100000, 1000000);

  return otp.toString();
};

export const hashOtp = (otp: string): string => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

export const compareOtp = (otp: string, hashedOtp: string): boolean => {
  const hashedInput = hashOtp(otp);

  return crypto.timingSafeEqual(
    Buffer.from(hashedInput),
    Buffer.from(hashedOtp),
  );
};
