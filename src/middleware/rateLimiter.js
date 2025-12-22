const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
    });
  }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
    });
  }
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration requests per hour
  message: {
    success: false,
    error: 'Çok fazla kayıt denemesi. Lütfen 1 saat sonra tekrar deneyin.'
  },
  handler: (req, res) => {
    logger.warn(`Register rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Çok fazla kayıt denemesi. Lütfen 1 saat sonra tekrar deneyin.'
    });
  }
});

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Çok fazla şifre sıfırlama talebi. Lütfen 1 saat sonra tekrar deneyin.'
  },
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Çok fazla şifre sıfırlama talebi. Lütfen 1 saat sonra tekrar deneyin.'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter
};




