const mealService = require('../../services/mealService');
const { MealMenu, MealReservation, Student, Cafeteria, Transaction, sequelize } = require('../../models');
const notificationService = require('../../services/notificationService');

jest.mock('../../models');
jest.mock('../../services/notificationService');

describe('MealService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMenus', () => {
    it('should get menus with default filters', async () => {
      const mockMenus = [
        { id: '1', menuDate: '2024-12-25', mealType: 'lunch', availableQuota: 100, reservedCount: 10 },
        { id: '2', menuDate: '2024-12-26', mealType: 'dinner', availableQuota: 50, reservedCount: 5 }
      ];

      MealMenu.findAll = jest.fn().mockResolvedValue(mockMenus);

      const result = await mealService.getMenus();

      expect(result).toHaveLength(2);
      expect(result[0].availableCapacity).toBe(90);
    });

    it('should filter menus by date', async () => {
      MealMenu.findAll = jest.fn().mockResolvedValue([]);

      await mealService.getMenus({ date: '2024-12-25' });

      expect(MealMenu.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ menuDate: '2024-12-25' })
        })
      );
    });

    it('should filter menus by mealType', async () => {
      MealMenu.findAll = jest.fn().mockResolvedValue([]);

      await mealService.getMenus({ mealType: 'lunch' });

      expect(MealMenu.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mealType: 'lunch' })
        })
      );
    });
  });

  describe('createReservation', () => {
    it('should create reservation for scholarship student', async () => {
      const mockStudent = {
        id: '1',
        userId: 'user1',
        hasScholarship: true
      };

      const mockMenu = {
        id: 'menu1',
        cafeteriaId: 'cafe1',
        price: 0,
        isActive: true,
        availableQuota: 100,
        reservedCount: 10
      };

      const mockReservation = {
        id: 'res1',
        studentId: '1',
        menuId: 'menu1',
        qrCode: 'qr123'
      };

      Student.findOne = jest.fn().mockResolvedValue(mockStudent);
      MealMenu.findByPk = jest.fn().mockResolvedValue(mockMenu);
      Cafeteria.findByPk = jest.fn().mockResolvedValue({ id: 'cafe1' });
      MealReservation.count = jest.fn().mockResolvedValue(1);
      MealReservation.create = jest.fn().mockResolvedValue(mockReservation);
      MealMenu.update = jest.fn().mockResolvedValue([1]);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      sequelize.transaction = jest.fn().mockImplementation((callback) => {
        const mockTransaction = {
          LOCK: { UPDATE: 'UPDATE' }
        };
        return callback(mockTransaction);
      });

      const result = await mealService.createReservation('user1', 'menu1');

      expect(result).toBeDefined();
      expect(MealReservation.create).toHaveBeenCalled();
    });

    it('should create reservation for paid student with sufficient balance', async () => {
      const mockStudent = {
        id: '1',
        userId: 'user1',
        hasScholarship: false
      };

      const mockMenu = {
        id: 'menu1',
        cafeteriaId: 'cafe1',
        price: 25,
        isActive: true,
        availableQuota: 100,
        reservedCount: 10
      };

      const mockUser = {
        id: 'user1',
        walletBalance: 100
      };

      const mockReservation = {
        id: 'res1',
        studentId: '1',
        menuId: 'menu1'
      };

      Student.findOne = jest.fn().mockResolvedValue(mockStudent);
      MealMenu.findByPk = jest.fn().mockResolvedValue(mockMenu);
      Cafeteria.findByPk = jest.fn().mockResolvedValue({ id: 'cafe1' });
      const { User } = require('../../models');
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      MealReservation.create = jest.fn().mockResolvedValue(mockReservation);
      Transaction.create = jest.fn().mockResolvedValue({});
      User.update = jest.fn().mockResolvedValue([1]);
      MealMenu.update = jest.fn().mockResolvedValue([1]);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      sequelize.transaction = jest.fn().mockImplementation((callback) => {
        const mockTransaction = {
          LOCK: { UPDATE: 'UPDATE' }
        };
        return callback(mockTransaction);
      });

      const result = await mealService.createReservation('user1', 'menu1');

      expect(result).toBeDefined();
      expect(Transaction.create).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      Student.findOne = jest.fn().mockResolvedValue(null);

      sequelize.transaction = jest.fn().mockImplementation((callback) => {
        const mockTransaction = {
          LOCK: { UPDATE: 'UPDATE' }
        };
        return callback(mockTransaction);
      });

      await expect(mealService.createReservation('user1', 'menu1')).rejects.toThrow('Student profile not found');
    });

    it('should throw error if menu not found', async () => {
      const mockStudent = { id: '1', userId: 'user1' };
      Student.findOne = jest.fn().mockResolvedValue(mockStudent);
      MealMenu.findByPk = jest.fn().mockResolvedValue(null);

      sequelize.transaction = jest.fn().mockImplementation((callback) => {
        const mockTransaction = {
          LOCK: { UPDATE: 'UPDATE' }
        };
        return callback(mockTransaction);
      });

      await expect(mealService.createReservation('user1', 'menu1')).rejects.toThrow('Menu not found');
    });

    it('should throw error if scholarship student exceeds daily limit', async () => {
      const mockStudent = {
        id: '1',
        userId: 'user1',
        hasScholarship: true
      };

      const mockMenu = {
        id: 'menu1',
        cafeteriaId: 'cafe1',
        price: 0,
        isActive: true,
        availableQuota: 100,
        reservedCount: 10
      };

      Student.findOne = jest.fn().mockResolvedValue(mockStudent);
      MealMenu.findByPk = jest.fn().mockResolvedValue(mockMenu);
      Cafeteria.findByPk = jest.fn().mockResolvedValue({ id: 'cafe1' });
      MealReservation.count = jest.fn().mockResolvedValue(2);

      sequelize.transaction = jest.fn().mockImplementation((callback) => {
        const mockTransaction = {
          LOCK: { UPDATE: 'UPDATE' }
        };
        return callback(mockTransaction);
      });

      await expect(mealService.createReservation('user1', 'menu1')).rejects.toThrow(/limit|maximum/i);
    });

    it('should throw error if paid student has insufficient balance', async () => {
      const mockStudent = {
        id: '1',
        userId: 'user1',
        hasScholarship: false
      };

      const mockMenu = {
        id: 'menu1',
        cafeteriaId: 'cafe1',
        price: 50,
        isActive: true,
        availableQuota: 100,
        reservedCount: 10
      };

      const mockUser = {
        id: 'user1',
        walletBalance: 10
      };

      Student.findOne = jest.fn().mockResolvedValue(mockStudent);
      MealMenu.findByPk = jest.fn().mockResolvedValue(mockMenu);
      Cafeteria.findByPk = jest.fn().mockResolvedValue({ id: 'cafe1' });
      const { User } = require('../../models');
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      sequelize.transaction = jest.fn().mockImplementation((callback) => {
        const mockTransaction = {
          LOCK: { UPDATE: 'UPDATE' }
        };
        return callback(mockTransaction);
      });

      await expect(mealService.createReservation('user1', 'menu1')).rejects.toThrow(/insufficient|balance/i);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation', async () => {
      const mockReservation = {
        id: 'res1',
        studentId: '1',
        menuId: 'menu1',
        status: 'reserved',
        destroy: jest.fn().mockResolvedValue(true)
      };

      MealReservation.findOne = jest.fn().mockResolvedValue(mockReservation);

      await mealService.cancelReservation('res1', 'user1');

      expect(mockReservation.destroy).toHaveBeenCalled();
    });

    it('should throw error if reservation not found', async () => {
      MealReservation.findOne = jest.fn().mockResolvedValue(null);

      await expect(mealService.cancelReservation('invalid', 'user1')).rejects.toThrow(/not found/i);
    });
  });

  describe('scanMeal', () => {
    it('should scan and mark meal as used', async () => {
      const mockReservation = {
        id: 'res1',
        qrCode: 'qr123',
        status: 'reserved',
        update: jest.fn().mockResolvedValue(true)
      };

      MealReservation.findOne = jest.fn().mockResolvedValue(mockReservation);

      const result = await mealService.scanMeal('qr123');

      expect(result).toBeDefined();
      expect(mockReservation.update).toHaveBeenCalledWith({ status: 'used' });
    });

    it('should throw error if QR code invalid', async () => {
      MealReservation.findOne = jest.fn().mockResolvedValue(null);

      await expect(mealService.scanMeal('invalid')).rejects.toThrow(/invalid|not found/i);
    });

    it('should throw error if meal already used', async () => {
      const mockReservation = {
        id: 'res1',
        qrCode: 'qr123',
        status: 'used'
      };

      MealReservation.findOne = jest.fn().mockResolvedValue(mockReservation);

      await expect(mealService.scanMeal('qr123')).rejects.toThrow(/already|used/i);
    });
  });
});

