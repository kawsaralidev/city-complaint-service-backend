import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

// Create a JWT token
const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
) => {
  // Sign the payload and create a JWT token
  const token = jwt.sign(payload, secret, {
    expiresIn,
  });

  return token;
};

// Verify a JWT token
const verifyToken = (token: string, secret: string) => {
  try {
    // Verify the JWT token
    const verifiedToken = jwt.verify(token, secret);

    return {
      success: true,
      data: verifiedToken,
    };
  } catch (error: any) {
    // Handle invalid or expired token
    console.log("Token verification failed:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};
