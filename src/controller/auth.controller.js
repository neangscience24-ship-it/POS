const jwt = require("jsonwebtoken");
const { CustomerProfile, User } = require("../models");
const {
  generateGoogleAuthUrl,
  getGoogleUserFromCode,
  verifyGoogleIdToken,
} = require("../services/googleAuth.service");
const logError = require("../helper/log_error");

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const GOOGLE_SUCCESS_REDIRECT_URL =
  process.env.GOOGLE_SUCCESS_REDIRECT_URL || `${CLIENT_URL}/auth/success`;
const GOOGLE_FAILURE_REDIRECT_URL =
  process.env.GOOGLE_FAILURE_REDIRECT_URL || `${CLIENT_URL}/auth/failure`;

/**
 * 1. INITIATE GOOGLE AUTH
 * Redirects the user's browser directly to Google's OAuth 2.0 consent page.
 */
const initiateGoogleAuth = async (req, res) => {
  try {
    const state = req.query.state || "customer";
    const authUrl = generateGoogleAuthUrl(state);
    return res.redirect(authUrl);
  } catch (error) {
    logError(res, error, "auth.initiateGoogleAuth");
  }
};

/**
 * 2. HANDLE GOOGLE CALLBACK
 * Exchanges Google authorization code for user profile, finds or registers
 * customer in database, generates JWT token, and redirects back to client.
 */
const handleGoogleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error || !code) {
      console.warn("[Google Auth Callback] Error returned by Google:", error);
      return res.redirect(
        `${GOOGLE_FAILURE_REDIRECT_URL}?error=${encodeURIComponent(
          error || "Google authorization code missing"
        )}`
      );
    }

    // Exchange auth code for user information
    const googleUser = await getGoogleUserFromCode(code);
    const { email, name, picture, googleId } = googleUser;

    if (!email) {
      return res.redirect(
        `${GOOGLE_FAILURE_REDIRECT_URL}?error=${encodeURIComponent(
          "No email address received from Google account"
        )}`
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const customerName = (name || email.split("@")[0] || "Customer").trim();

    // Auto-register or locate customer in tbl_customer_profile
    let [customer] = await CustomerProfile.findOrCreate({
      where: { email: normalizedEmail },
      defaults: {
        customer_name: customerName,
        email: normalizedEmail,
        loyalty_points: 50,
        active: 1,
      },
    });

    if (customer.active !== 1) {
      return res.redirect(
        `${GOOGLE_FAILURE_REDIRECT_URL}?error=${encodeURIComponent(
          "Customer account is deactivated"
        )}`
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        email: customer.email,
        role: "customer",
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Redirect to frontend callback route with token & profile data
    const redirectUrl = new URL(GOOGLE_SUCCESS_REDIRECT_URL);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("customer_id", customer.customer_id);
    redirectUrl.searchParams.set("customer_name", customer.customer_name);
    redirectUrl.searchParams.set("email", customer.email);

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("[Google Auth Callback] Exception:", error);
    return res.redirect(
      `${GOOGLE_FAILURE_REDIRECT_URL}?error=${encodeURIComponent(
        error.message || "Failed to complete Google authentication"
      )}`
    );
  }
};

/**
 * 3. VERIFY GOOGLE ID TOKEN
 * Directly validates Google ID token credential (from Google One-Tap or GIS frontend button).
 */
const verifyGoogleCredential = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential ID token is required",
      });
    }

    const payload = await verifyGoogleIdToken(credential);
    const normalizedEmail = payload.email.toLowerCase().trim();
    const customerName = (payload.name || payload.email.split("@")[0] || "Customer").trim();

    let [customer] = await CustomerProfile.findOrCreate({
      where: { email: normalizedEmail },
      defaults: {
        customer_name: customerName,
        email: normalizedEmail,
        loyalty_points: 50,
        active: 1,
      },
    });

    const token = jwt.sign(
      {
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        email: customer.email,
        role: "customer",
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    const safeCustomer = customer.toJSON ? customer.toJSON() : { ...customer };
    delete safeCustomer.password;

    return res.status(200).json({
      success: true,
      message: `Welcome, ${customer.customer_name}!`,
      token,
      customer: safeCustomer,
    });
  } catch (error) {
    logError(res, error, "auth.verifyGoogleCredential");
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback,
  verifyGoogleCredential,
};
