const validateRequest = require('../../middleware/validateRequest');
const errorHandler = require('../../middleware/errorHandler');
const authGuard = require('../../middleware/auth');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

jest.mock('express-validator');
jest.mock('../../models');
jest.mock('jsonwebtoken');

describe('Middleware Tests', () => {
  describe('validateRequest', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should call next when validation passes', () => {
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      validateRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when validation fails', () => {
      const errors = [
        { msg: 'Email is required' },
        { msg: 'Password is too short' }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      validateRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required, Password is too short',
        errors
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
      console.error = jest.fn();
    });

    it('should handle SequelizeValidationError', () => {
      const err = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'Email is invalid' },
          { message: 'Name is required' }
        ]
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Email is invalid, Name is required'
        })
      );
    });

    it('should handle SequelizeUniqueConstraintError for email', () => {
      const err = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email' }]
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bu e-posta adresi zaten kullanılıyor'
        })
      );
    });

    it('should handle SequelizeUniqueConstraintError for studentNumber', () => {
      const err = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'studentNumber' }]
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bu öğrenci numarası zaten kullanılıyor'
        })
      );
    });

    it('should handle JsonWebTokenError', () => {
      const err = {
        name: 'JsonWebTokenError',
        message: 'Invalid token'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid token'
        })
      );
    });

    it('should handle TokenExpiredError', () => {
      const err = {
        name: 'TokenExpiredError',
        message: 'Token expired'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token expired'
        })
      );
    });

    it('should handle SequelizeForeignKeyConstraintError', () => {
      const err = {
        name: 'SequelizeForeignKeyConstraintError',
        message: 'Foreign key error'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Resource not found'
        })
      );
    });

    it('should handle generic errors', () => {
      const err = {
        message: 'Something went wrong'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Something went wrong'
        })
      );
    });

    it('should translate common error messages to Turkish', () => {
      const err = {
        message: 'Invalid credentials'
      };

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Geçersiz e-posta veya şifre'
        })
      );
    });
  });

  describe('authGuard', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should allow access with valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        isActive: true
      };

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: '1' });
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authGuard(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user not found', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: '1' });
      User.findByPk = jest.fn().mockResolvedValue(null);

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found or inactive'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user is inactive', async () => {
      const mockUser = {
        id: '1',
        isActive: false
      };

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: '1' });
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found or inactive'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

