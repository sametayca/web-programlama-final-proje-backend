const request = require('supertest');

// Mock services before requiring server
jest.mock('../../services/authService', () => ({
  register: jest.fn(),
  verifyEmail: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  updateProfilePicture: jest.fn()
}));

jest.mock('../../middleware/auth', () => {
  return jest.fn((req, res, next) => {
    req.user = { id: '123', email: 'test@test.com' };
    next();
  });
});

const app = require('../../server');
const authService = require('../../services/authService');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      authService.register.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(authService.register).toHaveBeenCalled();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle registration errors', async () => {
      authService.register.mockRejectedValue(new Error('Email exists'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      authService.verifyEmail.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: 'valid-token' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token');
    });

    it('should return 400 when token is missing', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle verify email errors', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: 'invalid-token' })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@test.com' },
        token: 'token',
        refreshToken: 'refresh'
      };
      authService.login.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle login errors', async () => {
      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const mockResult = { token: 'new-token', refreshToken: 'new-refresh' };
      authService.refreshToken.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should return 400 when refresh token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle refresh token errors', async () => {
      authService.refreshToken.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      authService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      const res = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(authService.logout).toHaveBeenCalledWith('123');
    });

    it('should handle logout errors', async () => {
      authService.logout.mockRejectedValue(new Error('Logout failed'));

      const res = await request(app)
        .post('/api/auth/logout')
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email', async () => {
      authService.forgotPassword.mockResolvedValue({
        message: 'If email exists, password reset link has been sent'
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(authService.forgotPassword).toHaveBeenCalledWith('test@test.com');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle forgot password errors', async () => {
      authService.forgotPassword.mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      authService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully'
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token',
          password: 'newpassword123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword123');
    });

    it('should return 400 for missing token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          password: 'newpassword123'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token',
          password: '123'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle reset password errors', async () => {
      authService.resetPassword.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile', async () => {
      const mockUser = { id: '123', email: 'test@test.com' };
      authService.getProfile.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/auth/profile')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(authService.getProfile).toHaveBeenCalledWith('123');
    });

    it('should handle get profile errors', async () => {
      authService.getProfile.mockRejectedValue(new Error('User not found'));

      const res = await request(app)
        .get('/api/auth/profile')
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update profile successfully', async () => {
      const mockUser = { id: '123', firstName: 'Updated' };
      authService.updateProfile.mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(authService.updateProfile).toHaveBeenCalledWith('123', { firstName: 'Updated' });
    });

    it('should return 400 for empty firstName', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle update profile errors', async () => {
      authService.updateProfile.mockRejectedValue(new Error('Update failed'));

      const res = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Updated' })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/profile/picture', () => {
    it('should return 400 when no file is uploaded', async () => {
      const res = await request(app)
        .post('/api/auth/profile/picture')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('upload a picture');
    });

    it('should upload profile picture successfully', async () => {
      const mockUser = { id: '123', profilePicture: 'profile-1234567890-123456789.jpg' };
      authService.updateProfilePicture.mockResolvedValue(mockUser);

      // Mock multer to simulate file upload
      jest.mock('../../middleware/upload', () => ({
        single: jest.fn(() => (req, res, next) => {
          req.file = {
            filename: 'profile-1234567890-123456789.jpg',
            originalname: 'test.jpg',
            mimetype: 'image/jpeg'
          };
          next();
        })
      }));

      const res = await request(app)
        .post('/api/auth/profile/picture')
        .attach('picture', Buffer.from('fake image'), 'test.jpg')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('uploaded successfully');
    });

    it('should handle profile picture upload errors', async () => {
      authService.updateProfilePicture.mockRejectedValue(new Error('Upload failed'));

      // Mock multer to simulate file upload
      jest.mock('../../middleware/upload', () => ({
        single: jest.fn(() => (req, res, next) => {
          req.file = {
            filename: 'profile-1234567890-123456789.jpg',
            originalname: 'test.jpg',
            mimetype: 'image/jpeg'
          };
          next();
        })
      }));

      const res = await request(app)
        .post('/api/auth/profile/picture')
        .attach('picture', Buffer.from('fake image'), 'test.jpg')
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });
});

