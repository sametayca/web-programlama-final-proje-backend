const jwt = require('jsonwebtoken');

// Mock models before requiring middleware
jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

const authGuard = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const errorHandler = require('../../middleware/errorHandler');
const { User } = require('../../models');

// Mock request, response, next
const createMockReq = (headers = {}, user = null) => ({
  headers,
  user
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

describe('Middleware Tests', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'student',
      isActive: true
    };
  });

  describe('authGuard', () => {
    it('should allow authenticated user with valid token', async () => {
      const token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret-key');
      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = createMockNext();

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authGuard(req, res, next);

      expect(User.findByPk).toHaveBeenCalledWith(mockUser.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const req = createMockReq({ authorization: 'Bearer invalid-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
    });

    it('should reject request when user is not found', async () => {
      const token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret-key');
      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = createMockNext();

      User.findByPk = jest.fn().mockResolvedValue(null);

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found or inactive'
      });
    });

    it('should reject request when user is inactive', async () => {
      const token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret-key');
      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = createMockNext();

      User.findByPk = jest.fn().mockResolvedValue({ ...mockUser, isActive: false });

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found or inactive'
      });
    });

  });

  describe('roleGuard', () => {
    it('should allow user with authorized role', () => {
      const req = createMockReq({}, { role: 'student' });
      const res = createMockRes();
      const next = createMockNext();

      const guard = roleGuard('student', 'faculty');
      guard(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject user without req.user', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const guard = roleGuard('student');
      guard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject user with unauthorized role', () => {
      const req = createMockReq({}, { role: 'student' });
      const res = createMockRes();
      const next = createMockNext();

      const guard = roleGuard('admin', 'faculty');
      guard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User role 'student' is not authorized to access this route"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow user with multiple authorized roles', () => {
      const req = createMockReq({}, { role: 'admin' });
      const res = createMockRes();
      const next = createMockNext();

      const guard = roleGuard('admin', 'faculty', 'student');
      guard(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    it('should handle SequelizeValidationError', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'Email is required' },
          { message: 'Password is required' }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required, Password is required'
      });
    });

    it('should handle SequelizeUniqueConstraintError for email', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email' }]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bu e-posta adresi zaten kullanılıyor'
      });
    });

    it('should handle SequelizeUniqueConstraintError for studentNumber', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'studentNumber' }]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bu öğrenci numarası zaten kullanılıyor'
      });
    });

    it('should handle SequelizeUniqueConstraintError for employeeNumber', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'employeeNumber' }]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bu personel numarası zaten kullanılıyor'
      });
    });

    it('should handle SequelizeForeignKeyConstraintError', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        name: 'SequelizeForeignKeyConstraintError'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found'
      });
    });

    it('should handle JsonWebTokenError', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        name: 'JsonWebTokenError'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
    });

    it('should handle TokenExpiredError', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        name: 'TokenExpiredError'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired'
      });
    });

    it('should handle generic errors with status code', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        statusCode: 500,
        message: 'Internal server error'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should include stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        statusCode: 500,
        message: 'Error',
        stack: 'Error stack trace'
      };

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Error',
          stack: 'Error stack trace'
        })
      );
    });

    it('should not include stack trace in production mode', () => {
      process.env.NODE_ENV = 'production';
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        statusCode: 500,
        message: 'Error',
        stack: 'Error stack trace'
      };

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything()
        })
      );
    });

    it('should handle errors without status code', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        message: 'Generic error message'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Generic error message'
      });
    });

    it('should handle errors without message', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server Error'
      });
    });

    it('should log errors to console', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      const error = {
        message: 'Test error'
      };

      errorHandler(error, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });
});


