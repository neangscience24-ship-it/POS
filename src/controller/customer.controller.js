const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { CustomerProfile } = require("../models");
const logError = require("../helper/log_error");
const { sendOtpEmail } = require("../helper/mail_config");

// In-memory OTP Store with 10-minute TTL: email => { otp, expiresAt, verified }
const otpStore = new Map();

// Helper to exclude password from returned customer object
const sanitizeCustomer = (customer) => {
  if (!customer) return null;
  const data = typeof customer.toJSON === "function" ? customer.toJSON() : { ...customer };
  delete data.password;
  return data;
};

// 1. CUSTOMER LOGIN (By phone, email, or username + optional password check)
const loginCustomer = async (req, res) => {
  try {
    const { identifier, phone, email, password } = req.body;
    const queryTerm = (identifier || phone || email || "").trim();

    if (!queryTerm) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number or email address",
      });
    }

    const customer = await CustomerProfile.findOne({
      where: {
        [Op.or]: [
          { phone: queryTerm },
          { email: queryTerm },
          { customer_name: queryTerm },
        ],
        active: 1,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `No active customer found with "${queryTerm}". Please register first.`,
      });
    }

    // If customer has a password configured, verify password
    if (customer.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for this account",
        });
      }
      const isMatch = await bcrypt.compare(password.trim(), customer.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password",
        });
      }
    }


    res.status(200).json({
      success: true,
      message: `Welcome back, ${customer.customer_name}!`,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    logError(res, error, "customer.loginCustomer");
  }
};

// 2. REGISTER NEW CUSTOMER (with optional password)
const registerCustomer = async (req, res) => {
  try {
    const { customer_name, phone, email, password, address, city, country } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: "Either phone number or email is required",
      });
    }

    // Check existing phone
    if (phone && phone.trim()) {
      const existingPhone = await CustomerProfile.findOne({
        where: { phone: phone.trim() },
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "This phone number is already registered",
        });
      }
    }

    // Check existing email
    if (email && email.trim()) {
      const existingEmail = await CustomerProfile.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "This email address is already registered",
        });
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim()) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
    }

    const newCustomer = await CustomerProfile.create({
      customer_name: customer_name.trim(),
      phone: phone && phone.trim() ? phone.trim() : null,
      email: email && email.trim() ? email.trim().toLowerCase() : null,
      password: hashedPassword,
      address: address && address.trim() ? address.trim() : null,
      city: city && city.trim() ? city.trim() : "Phnom Penh",
      country: country && country.trim() ? country.trim() : "Cambodia",
      loyalty_points: 50, // Welcome gift loyalty points
      active: 1,
    });

    res.status(201).json({
      success: true,
      message: "Customer account created successfully!",
      customer: sanitizeCustomer(newCustomer),
    });
  } catch (error) {
    logError(res, error, "customer.registerCustomer");
  }
};

// 3. GET SINGLE CUSTOMER BY ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerProfile.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    logError(res, error, "customer.getCustomerById");
  }
};

// 4. GET ALL CUSTOMERS
const getAllCustomers = async (req, res) => {
  try {
    const customers = await CustomerProfile.findAll({
      attributes: { exclude: ["password"] },
      order: [["customer_id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      total: customers.length,
      list: customers,
    });
  } catch (error) {
    logError(res, error, "customer.getAllCustomers");
  }
};

// 5. SEND OTP TO CUSTOMER EMAIL (Password Reset Step 1)
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer email is required to send OTP",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify customer exists in database
    const customer = await CustomerProfile.findOne({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `No customer account found with email "${email}"`,
      });
    }

    if (customer.active !== 1) {
      return res.status(403).json({
        success: false,
        message: "This customer account is inactive or disabled",
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

    // Store in memory
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      verified: false,
    });

    // Send email via nodemailer
    try {
      await sendOtpEmail(customer.email, otp, customer.customer_name);
    } catch (mailError) {
      console.error("[sendOTP] Email sending warning:", mailError.message);
      // In development, log the OTP so testing can continue smoothly
      return res.status(200).json({
        success: true,
        message: "OTP generated. (Email server warning: " + mailError.message + ")",
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    }

    res.status(200).json({
      success: true,
      message: `OTP code sent successfully to ${customer.email}`,
      email: customer.email,
    });
  } catch (error) {
    logError(res, error, "customer.sendOTP");
  }
};

// 6. VERIFY OTP (Password Reset Step 2)
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP code is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const storedRecord = otpStore.get(normalizedEmail);

    if (!storedRecord || Date.now() > storedRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or was not requested. Please request a new code.",
      });
    }

    if (storedRecord.otp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code. Please check and try again.",
      });
    }

    // Mark as verified
    storedRecord.verified = true;

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You may now proceed to set a new password.",
    });
  } catch (error) {
    logError(res, error, "customer.verifyOTP");
  }
};

// 7. SET NEW PASSWORD (Password Reset Step 3)
const setNewPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, new_password, password } = req.body;
    const targetPassword = (newPassword || new_password || password || "").trim();

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP code is required",
      });
    }

    if (!targetPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (targetPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const storedRecord = otpStore.get(normalizedEmail);

    if (!storedRecord || Date.now() > storedRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP code.",
      });
    }

    if (storedRecord.otp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code",
      });
    }

    const customer = await CustomerProfile.findOne({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with email "${email}" not found`,
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(targetPassword, saltRounds);

    // Update customer record
    await customer.update({ password: hashedPassword });

    // Invalidate OTP to prevent replay
    otpStore.delete(normalizedEmail);

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    logError(res, error, "customer.setNewPassword");
  }
};

// 8. GOOGLE LOGIN FOR CUSTOMER (Single Sign-On & Auto Registration)
const googleLoginCustomer = async (req, res) => {
  try {
    const { email, name, customer_name, credential } = req.body;
    let targetEmail = email;
    let targetName = name || customer_name;

    // Optional Google ID Token verification
    if (credential) {
      try {
        const { verifyGoogleIdToken } = require("../services/googleAuth.service");
        const payload = await verifyGoogleIdToken(credential);
        targetEmail = payload.email;
        targetName = payload.name;
      } catch (tokenErr) {
        console.warn("[googleLoginCustomer] Token verification note:", tokenErr.message);
      }
    }

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: "Google email is required for sign in",
      });
    }

    targetEmail = targetEmail.trim().toLowerCase();
    targetName = (targetName || targetEmail.split("@")[0] || "Customer").trim();

    // Find customer by email or create new profile
    let [customer, created] = await CustomerProfile.findOrCreate({
      where: { email: targetEmail },
      defaults: {
        customer_name: targetName,
        email: targetEmail,
        loyalty_points: 50,
        active: 1,
      },
    });

    if (customer.active !== 1) {
      return res.status(403).json({
        success: false,
        message: "This customer account is disabled",
      });
    }

    res.status(200).json({
      success: true,
      message: created ? `Welcome to Volta, ${customer.customer_name}!` : `Welcome back, ${customer.customer_name}!`,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    logError(res, error, "customer.googleLoginCustomer");
  }
};

module.exports = {
  loginCustomer,
  registerCustomer,
  getCustomerById,
  getAllCustomers,
  sendOTP,
  SendOTP: sendOTP,
  verifyOTP,
  verify_otp: verifyOTP,
  verify_Otp: verifyOTP,
  setNewPassword,
  googleLoginCustomer,
};

