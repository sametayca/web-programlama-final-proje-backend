const express = require('express');
const { body } = require('express-validator');
const authService = require('../services/authService');
const authGuard = require('../middleware/auth');
const upload = require('../middleware/upload');
const validateRequest = require('../middleware/validateRequest');
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, faculty, admin, staff]
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               enrollmentYear:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and return JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile
 *     description: Retrieve authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Custom password validation
const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Şifre en az 8 karakter olmalıdır')
  .matches(/[A-Z]/)
  .withMessage('Şifre en az bir büyük harf içermelidir')
  .matches(/[0-9]/)
  .withMessage('Şifre en az bir rakam içermelidir');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  passwordValidation,
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['student', 'faculty', 'admin', 'staff'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
  body('token').notEmpty(),
  passwordValidation
];

const updateProfileValidation = [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().trim()
];

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerLimiter, registerValidation, validateRequest, async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    console.log('📥 Verify email request received, token length:', token?.length);
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Doğrulama token\'ı gerekli',
        message: 'Doğrulama token\'ı gerekli'
      });
    }

    // Trim token to handle any whitespace
    const trimmedToken = token.trim();
    
    const user = await authService.verifyEmail(trimmedToken);
    res.json({
      success: true,
      message: 'E-posta başarıyla doğrulandı',
      data: user
    });
  } catch (error) {
    console.error('❌ Verify email error:', error.message);
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, loginValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authGuard, async (req, res, next) => {
  try {
    const result = await authService.logout(req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validateRequest, async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', resetPasswordValidation, validateRequest, async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authGuard, async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authGuard, updateProfileValidation, validateRequest, async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile/picture', authGuard, upload.single('picture'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a picture'
      });
    }

    const user = await authService.updateProfilePicture(req.user.id, req.file.filename);
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: `/uploads/profile-pictures/${user.profilePicture}`
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

