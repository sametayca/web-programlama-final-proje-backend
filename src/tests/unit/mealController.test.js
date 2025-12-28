const mealController = require('../../controllers/mealController');
const mealService = require('../../services/mealService');
const logger = require('../../config/logger');

jest.mock('../../services/mealService');
jest.mock('../../config/logger');

describe('MealController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 'user1', role: 'student' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getMenus', () => {
    it('should get menus successfully', async () => {
      const mockMenus = [
        { id: '1', menuDate: '2024-12-25', mealType: 'lunch' },
        { id: '2', menuDate: '2024-12-25', mealType: 'dinner' }
      ];

      mealService.getMenus = jest.fn().mockResolvedValue(mockMenus);

      await mealController.getMenus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockMenus
      });
    });

    it('should handle errors', async () => {
      mealService.getMenus = jest.fn().mockRejectedValue(new Error('Database error'));

      await mealController.getMenus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createReservation', () => {
    it('should create reservation successfully', async () => {
      req.body = { menuId: 'menu1' };

      const mockReservation = {
        id: 'res1',
        studentId: 'user1',
        menuId: 'menu1',
        qrCode: 'qr123'
      };

      mealService.createReservation = jest.fn().mockResolvedValue(mockReservation);

      await mealController.createReservation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Reservation created successfully',
        data: mockReservation
      });
    });

    it('should handle errors', async () => {
      req.body = { menuId: 'menu1' };
      mealService.createReservation = jest.fn().mockRejectedValue(new Error('Menu not found'));

      await mealController.createReservation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('scanMeal', () => {
    it('should scan meal successfully', async () => {
      req.body = { qrCode: 'qr123' };

      const mockResult = {
        reservation: { id: 'res1', status: 'used' },
        message: 'Meal scanned successfully'
      };

      mealService.scanMeal = jest.fn().mockResolvedValue(mockResult);

      await mealController.scanMeal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Meal scanned successfully',
        data: mockResult
      });
    });

    it('should return 400 for invalid QR code', async () => {
      req.body = { qrCode: 'invalid' };
      mealService.scanMeal = jest.fn().mockRejectedValue(new Error('Invalid QR code'));

      await mealController.scanMeal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createMenu', () => {
    it('should create menu for admin', async () => {
      req.user.role = 'admin';
      req.body = {
        menuDate: '2024-12-25',
        mealType: 'lunch',
        items: ['Soup', 'Main Course'],
        price: 25
      };

      const mockMenu = { id: 'menu1', ...req.body };
      mealService.createMenu = jest.fn().mockResolvedValue(mockMenu);

      await mealController.createMenu(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Menu created successfully',
        data: mockMenu
      });
    });

    it('should reject menu creation for students', async () => {
      req.user.role = 'student';
      req.body = { menuDate: '2024-12-25', mealType: 'lunch' };

      await mealController.createMenu(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only admins and staff can create menus'
      });
    });
  });
});

