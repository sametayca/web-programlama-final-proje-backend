// Mock express-validator before requiring validateRequest
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const validateRequest = require('../../middleware/validateRequest');
const { validationResult } = require('express-validator');

describe('validateRequest Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next when validation passes', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    validateRequest(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 400 with errors when validation fails', () => {
    const mockErrors = [
      { msg: 'Email is required', param: 'email' },
      { msg: 'Password must be at least 6 characters', param: 'password' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors
    });

    validateRequest(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      errors: mockErrors
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle empty error array', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => []
    });

    validateRequest(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      errors: []
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle single validation error', () => {
    const mockErrors = [
      { msg: 'Invalid email format', param: 'email' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors
    });

    validateRequest(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      errors: mockErrors
    });
  });

  it('should work with different request objects', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    const req1 = { body: {} };
    const req2 = { body: { email: 'test@example.com' } };

    validateRequest(req1, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);

    validateRequest(req2, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(2);
  });
});

