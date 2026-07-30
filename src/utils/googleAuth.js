// src/utils/googleAuth.js
// Handles Google OAuth 2.0 using the official googleapis library.

import { google } from "googleapis";
import config from "../config/config.js";

/**
 * Create a configured OAuth2 client.
 */
export const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );
};

/**
 * Generate the Google OAuth consent-screen URL.
 * @returns {string} URL to redirect the user to
 */
export const getGoogleAuthUrl = () => {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "select_account", // Always show account picker
  });
};

/**
 * Exchange an authorization code for tokens and fetch the user's Google profile.
 * @param {string} code — The code returned by Google in the callback query string
 * @returns {{ googleId, email, name, picture, emailVerified }}
 */
export const getGoogleUserProfile = async (code) => {
  const client = createOAuth2Client();

  // Exchange code for tokens
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Fetch user info using the oauth2 v2 endpoint
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();

  return {
    googleId: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
    emailVerified: data.verified_email,
  };
};
