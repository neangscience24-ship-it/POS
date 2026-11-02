const {
  loginCustomer,
  registerCustomer,
  getCustomerById,
  getAllCustomers,
  SendOTP,
  verify_otp,
  setNewPassword,
  googleLoginCustomer,
} = require("../controller/customer.controller");
const {
  initiateGoogleAuth,
  handleGoogleCallback,
  verifyGoogleCredential,
} = require("../controller/auth.controller");

function CustomerRoute(app) {
  app.post("/api/v1/customer/login", loginCustomer);
  app.post("/api/v1/customer/register", registerCustomer);
  app.get("/api/v1/customer/profile/:id", getCustomerById);
  app.get("/api/v1/customer/getall", getAllCustomers);

  // Google OAuth 2.0 (Direct redirect endpoints)
  app.get("/api/v1/auth/google", initiateGoogleAuth);
  app.get("/api/v1/auth/google/callback", handleGoogleCallback);
  app.get("/auth/google/callback", handleGoogleCallback);
  app.get("/api/v1/customer/auth/google", initiateGoogleAuth);

  // Google Single Sign-On (JSON API endpoints)
  app.post("/api/v1/customer/google-login", googleLoginCustomer);
  app.post("/api/v1/auth/google/customer", googleLoginCustomer);
  app.post("/api/v1/auth/google/verify", verifyGoogleCredential);

  // Send OTP to email
  app.post("/api/v1/customer/send-otp", SendOTP);
  app.post("/api/v1/user/send-otp", SendOTP);

  // Verify OTP
  app.post("/api/v1/customer/verify-otp", verify_otp);
  app.post("/api/v1/user/verify-otp", verify_otp);

  // Set new password
  app.post("/api/v1/customer/set-new-password", setNewPassword);
  app.post("/api/v1/user/set-new-password", setNewPassword);
}

module.exports = CustomerRoute;
