const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const { User, Student, Faculty, Department } = require('../../models');
const authService = require('../../services/authService');
const emailService = require('../../services/emailService');

jest.mock('../../services/authService');
jest.mock('../../services/emailService');
jest.mock('../../models');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new student successfully', async () => {
      const userData = {
        email: 'student@test.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        departmentId: 'dept1',
        enrollmentYear: 2024
      };

      const mockUser = {
        id: 'user1',
        ...userData,
        toJSON: () => ({ ...userData, id: 'user1' })
      };

      authService.register = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(authService.register).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@test.com',
        password: 'Password123'
      };

      const mockResult = {
        user: { id: 'user1', email: 'test@test.com' },
        token: 'jwt-token',
        refreshToken: 'refresh-token'
      };

      authService.login = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@test.com',
        password: 'WrongPassword'
      };

      authService.login = jest.fn().mockRejectedValue(new Error('Geçersiz e-posta veya şifre'));

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@test.com',
        isEmailVerified: true
      };

      authService.verifyEmail = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/verify-email')
        .query({ token: 'valid-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('doğrulandı');
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .get('/auth/verify-email')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email', async () => {
      authService.forgotPassword = jest.fn().mockResolvedValue({
        message: 'If email exists, password reset link has been sent'
      });

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authService.forgotPassword).toHaveBeenCalledWith('test@test.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      authService.resetPassword = jest.fn().mockResolvedValue({
        message: 'Password reset successfully'
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'valid-token',
          password: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authService.resetPassword).toHaveBeenCalled();
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'valid-token',
          password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/profile', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      authService.refreshToken = jest.fn().mockResolvedValue({
        token: 'new-token',
        refreshToken: 'new-refresh-token'
      });

      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

