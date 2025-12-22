const { MealMenu, MealReservation, Student, User, Cafeteria, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class MealService {
  /**
   * Get available meal menus with filters
   * @param {Object} filters - { date, mealType, cafeteriaId }
   * @returns {Promise<Array>}
   */
  async getMenus(filters = {}) {
    const where = { isActive: true };

    if (filters.date) {
      where.menuDate = filters.date;
    } else {
      // Default to today onwards
      where.menuDate = {
        [Op.gte]: new Date().toISOString().split('T')[0]
      };
    }

    if (filters.mealType) {
      where.mealType = filters.mealType;
    }

    if (filters.cafeteriaId) {
      where.cafeteriaId = filters.cafeteriaId;
    }

    const menus = await MealMenu.findAll({
      where,
      include: [
        {
          model: Cafeteria,
          as: 'cafeteria',
          attributes: ['id', 'name', 'location']
        }
      ],
      order: [['menuDate', 'ASC'], ['mealType', 'ASC']]
    });

    return menus;
  }

  /**
   * Create a meal reservation
   * Business Rules:
   * - Burslu öğrenciler: günde max 2 öğün
   * - Ücretli öğrenciler: wallet bakiyesi yeterli olmalı
   * - QR code UUID ile oluşturulur
   * - Ücretli öğrencide para KULLANILDIĞINDA düşecek (rezervasyonda değil)
   * 
   * @param {string} studentId - User ID (student)
   * @param {string} menuId - Meal menu ID
   * @returns {Promise<Object>}
   */
  async createReservation(studentId, menuId) {
    const t = await sequelize.transaction();

    try {
      // Get student profile
      const student = await Student.findOne({
        where: { userId: studentId },
        transaction: t
      });

      if (!student) {
        throw new Error('Student profile not found');
      }

      // Get menu details
      const menu = await MealMenu.findByPk(menuId, {
        include: [
          {
            model: Cafeteria,
            as: 'cafeteria'
          }
        ],
        transaction: t,
        lock: t.LOCK.UPDATE // Row-level lock for ACID
      });

      if (!menu || !menu.isActive) {
        throw new Error('Menu not found or inactive');
      }

      // Check if menu is for today or future
      const menuDate = new Date(menu.menuDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (menuDate < today) {
        throw new Error('Cannot reserve meals for past dates');
      }

      // Check quota availability
      if (menu.reservedCount >= menu.availableQuota) {
        throw new Error('No available quota for this meal');
      }

      // Check daily meal limit for scholarship students
      if (student.isScholarship) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayReservationCount = await MealReservation.count({
          where: {
            studentId,
            reservationDate: {
              [Op.between]: [todayStart, todayEnd]
            },
            status: {
              [Op.in]: ['pending', 'used']
            }
          },
          transaction: t
        });

        if (todayReservationCount >= 2) {
          throw new Error('Scholarship students can reserve maximum 2 meals per day');
        }
      }

      // Check if already reserved the same meal
      const existingReservation = await MealReservation.findOne({
        where: {
          studentId,
          menuId,
          status: {
            [Op.in]: ['pending', 'used']
          }
        },
        transaction: t
      });

      if (existingReservation) {
        throw new Error('You have already reserved this meal');
      }

      // For non-scholarship students, check wallet balance
      // NOTE: Money will be deducted when meal is USED, not at reservation
      if (!student.isScholarship) {
        if (student.walletBalance < menu.price) {
          throw new Error(`Insufficient wallet balance. Required: ${menu.price}, Available: ${student.walletBalance}`);
        }
      }

      // Generate QR code (UUID)
      const qrCode = uuidv4();

      // Create reservation
      const reservation = await MealReservation.create({
        studentId,
        menuId,
        qrCode,
        status: 'pending',
        isScholarshipMeal: student.isScholarship,
        amountPaid: student.isScholarship ? 0 : menu.price // Will be charged when used
      }, { transaction: t });

      // Increment reserved count
      await menu.increment('reservedCount', { transaction: t });

      // Commit transaction
      await t.commit();

      // Return reservation with menu details
      const reservationWithDetails = await MealReservation.findByPk(reservation.id, {
        include: [
          {
            model: MealMenu,
            as: 'menu',
            include: [
              {
                model: Cafeteria,
                as: 'cafeteria'
              }
            ]
          }
        ]
      });

      return reservationWithDetails;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Cancel a meal reservation
   * @param {string} reservationId - Reservation ID
   * @param {string} studentId - Student user ID
   * @returns {Promise<Object>}
   */
  async cancelReservation(reservationId, studentId) {
    const t = await sequelize.transaction();

    try {
      const reservation = await MealReservation.findOne({
        where: {
          id: reservationId,
          studentId
        },
        include: [
          {
            model: MealMenu,
            as: 'menu'
          }
        ],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'pending') {
        throw new Error(`Cannot cancel reservation with status: ${reservation.status}`);
      }

      // Check if meal date is still in the future (allow cancel up to 1 hour before meal)
      const menuDate = new Date(reservation.menu.menuDate);
      const now = new Date();
      
      // Simple check: cannot cancel on the same day
      if (menuDate.toDateString() === now.toDateString()) {
        throw new Error('Cannot cancel reservation on the same day of the meal');
      }

      // Update reservation status
      await reservation.update({ status: 'cancelled' }, { transaction: t });

      // Decrement reserved count
      await reservation.menu.decrement('reservedCount', { transaction: t });

      await t.commit();

      return reservation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Use a meal reservation (scan QR code)
   * This is where the money is deducted for non-scholarship students
   * 
   * @param {string} reservationId - Reservation ID
   * @param {string} qrCode - QR code to verify
   * @returns {Promise<Object>}
   */
  async useReservation(reservationId, qrCode) {
    const t = await sequelize.transaction();

    try {
      const reservation = await MealReservation.findOne({
        where: {
          id: reservationId,
          qrCode
        },
        include: [
          {
            model: MealMenu,
            as: 'menu'
          },
          {
            model: User,
            as: 'student',
            include: [
              {
                model: Student,
                as: 'studentProfile'
              }
            ]
          }
        ],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!reservation) {
        throw new Error('Reservation not found or invalid QR code');
      }

      if (reservation.status !== 'pending') {
        throw new Error(`Cannot use reservation with status: ${reservation.status}`);
      }

      // Check if meal is for today
      const menuDate = new Date(reservation.menu.menuDate);
      const today = new Date();
      menuDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (menuDate.getTime() !== today.getTime()) {
        throw new Error('This reservation is not valid for today');
      }

      const studentProfile = reservation.student.studentProfile;

      // Deduct money for non-scholarship students
      if (!reservation.isScholarshipMeal) {
        const currentBalance = parseFloat(studentProfile.walletBalance);
        const mealPrice = parseFloat(reservation.menu.price);

        if (currentBalance < mealPrice) {
          throw new Error('Insufficient wallet balance');
        }

        const newBalance = currentBalance - mealPrice;

        // Update student wallet balance
        await studentProfile.update({
          walletBalance: newBalance
        }, { transaction: t });

        // Create transaction record
        await Transaction.create({
          studentId: reservation.studentId,
          type: 'meal_payment',
          amount: mealPrice,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Payment for ${reservation.menu.mealType} - ${reservation.menu.mainCourse}`,
          referenceId: reservation.id,
          referenceType: 'meal_reservation'
        }, { transaction: t });
      }

      // Mark reservation as used
      await reservation.update({
        status: 'used',
        usedAt: new Date()
      }, { transaction: t });

      await t.commit();

      return reservation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Get student's meal reservations
   * @param {string} studentId - Student user ID
   * @param {Object} filters - { status, startDate, endDate }
   * @returns {Promise<Array>}
   */
  async getStudentReservations(studentId, filters = {}) {
    const where = { studentId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.reservationDate = {};
      if (filters.startDate) {
        where.reservationDate[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.reservationDate[Op.lte] = filters.endDate;
      }
    }

    const reservations = await MealReservation.findAll({
      where,
      include: [
        {
          model: MealMenu,
          as: 'menu',
          include: [
            {
              model: Cafeteria,
              as: 'cafeteria'
            }
          ]
        }
      ],
      order: [['reservationDate', 'DESC']]
    });

    return reservations;
  }

  /**
   * Get student's transaction history
   * @param {string} studentId - Student user ID
   * @param {Object} filters - { type, startDate, endDate, limit }
   * @returns {Promise<Array>}
   */
  async getTransactionHistory(studentId, filters = {}) {
    const where = { studentId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt[Op.lte] = filters.endDate;
      }
    }

    const transactions = await Transaction.findAll({
      where,
      limit: filters.limit || 50,
      order: [['createdAt', 'DESC']]
    });

    return transactions;
  }
}

module.exports = new MealService();

