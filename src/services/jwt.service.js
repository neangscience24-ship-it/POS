var jwt = require('jsonwebtoken');
var dotenv = require('dotenv');
dotenv.config();

/**
 * Generate a signed JWT token
 * @param {object} payload - Data to embed in the token (e.g. { id, email, name })
 * @param {object} options - Optional jwt sign options
 * @returns {string} Signed JWT string
 */
 const signJwt = (payload, options = {}) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
    ...options,
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {object|null} Decoded token payload or null if invalid/expired
 */
 const verifyJwt = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};


module.exports ={
    signJwt,
    verifyJwt
}