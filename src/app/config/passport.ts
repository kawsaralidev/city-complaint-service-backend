import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import config from ".";
import { prisma } from "../lib/prisma";

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id,
      clientSecret: config.google_client_secret,
      callbackURL: config.google_callback_url,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Get Google account information
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName;
        const imageUrl = profile.photos?.[0]?.value;

        // Throw error if Google email is unavailable
        if (!email) {
          return done(null, false);
        }

        // Check if Google account already exists
        let user = await prisma.user.findUnique({
          where: {
            googleId,
          },
        });

        // Find existing user by email
        if (!user) {
          user = await prisma.user.findUnique({
            where: {
              email: email.toLowerCase(),
            },
          });
        }

        // Create a new citizen if user does not exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              name,
              email: email.toLowerCase(),
              googleId,
              authProvider: "GOOGLE",
              emailVerified: true,
              role: "CITIZEN",
              status: "ACTIVE",
              imageUrl,
            },
          });
        }

        // Return authenticated user
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export default passport;
