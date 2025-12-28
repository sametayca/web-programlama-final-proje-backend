const walletController = require('../../controllers/walletController');
const walletService = require('../../services/paymentService');
const logger = require('../../config/logger');

jest.mock('../../services/paymentService');
jest.mock('../../config/logger');

describe('WalletController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'user1', role: 'student' },
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should get wallet balance successfully', async () => {
      const mockBalance = { balance: 100.50 };

      walletService.getWalletBalance = jest.fn().mockResolvedValue(mockBalance);

      await walletController.getBalance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockBalance
      });
    });

    it('should handle errors', async () => {
      walletService.getWalletBalance = jest.fn().mockRejectedValue(new Error('Database error'));

      await walletController.getBalance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addFunds', () => {
    it('should add funds to wallet', async () => {
      req.body = { amount: 50, paymentMethod: 'card' };

      const mockTransaction = {
        id: 'tx1',
        amount: 50,
        type: 'deposit',
        status: 'completed'
      };

      walletService.addFunds = jest.fn().mockResolvedValue(mockTransaction);

      await walletController.addFunds(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Funds added successfully',
        data: mockTransaction
      });
    });

    it('should return 400 for invalid amount', async () => {
      req.body = { amount: -10 };

      await walletController.addFunds(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getTransactions', () => {
    it('should get transaction history', async () => {
      const mockTransactions = [
        { id: 'tx1', amount: 50, type: 'deposit' },
        { id: 'tx2', amount: 25, type: 'payment' }
      ];

      walletService.getTransactions = jest.fn().mockResolvedValue(mockTransactions);

      await walletController.getTransactions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockTransactions
      });
    });
  });
});

