var  { OAuth2Client } = require('google-auth-library');
var dotenv = require('dotenv');
dotenv.config();

/**
 * Creates and returns an initialized Google OAuth2 Client instance.
 */
 const getOAuth2Client = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      '[Google OAuth] Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Please set them in your .env file.'
    );
  }

  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL ||
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5000/api/v1/auth/google/callback";

  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

/**
 * Generates the Google OAuth consent URL.
 * @param {string} state - Optional state parameter for CSRF protection or custom metadata
 * @returns {string} Google OAuth URL
 */
 const generateGoogleAuthUrl = (state = '') => {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Requests refresh_token
    prompt: 'consent',      // Forces approval prompt so refresh_token is always returned
    scope: scopes,
    state,
  });
};

/**
 * Exchanges authorization code for tokens and extracts verified user profile.
 * @param {string} code - Authorization code returned by Google callback
 * @returns {Promise<object>} User profile object
 */
 const getGoogleUserFromCode = async (code) => {
  const oauth2Client = getOAuth2Client();

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Verify ID token and extract claims
  if (!tokens.id_token) {
    throw new Error('No ID token returned by Google');
  }

  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('Unable to extract payload from Google ID token');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    picture: payload.picture || '',
    locale: payload.locale || 'en',
    tokens: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    },
  };
};

/**
 * Verifies a Google ID Token credential directly (e.g. from Google One-Tap or frontend GIS button).
 * @param {string} idToken - The credential ID token sent from frontend
 * @returns {Promise<object>} Verified user profile object
 */
 const verifyGoogleIdToken = async (idToken) => {
  const oauth2Client = getOAuth2Client();

  const ticket = await oauth2Client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('Invalid Google ID token payload');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    picture: payload.picture || '',
    locale: payload.locale || 'en',
  };
};


module.exports = {
    getOAuth2Client,
    generateGoogleAuthUrl,
    getGoogleUserFromCode,
    verifyGoogleIdToken
}