const { MealMenu, MealReservation, Student, User, Cafeteria, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService');

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

    // Calculate available capacity for each menu
    const menusWithCapacity = await Promise.all(menus.map(async (menu) => {
      const menuData = menu.toJSON();
      // Use availableQuota - reservedCount for availableCapacity
      menuData.availableCapacity = Math.max(0, (menu.availableQuota || 0) - (menu.reservedCount || 0));
      
      return menuData;
    }));

    return menusWithCapacity;
  }

  /**
   * Create a meal reservation
   * Business Rules:
   * - Burslu öğrenciler: günde max 2 öğün
   * - Ücretli öğrenciler: wallet bakiyesi yeterli olmalı
   * - QR code UUID ile oluşturulur
   * - Ücretli öğrencide para REZERVASYONDA düşer
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

      // Get menu details (without include for lock to work)
      const menu = await MealMenu.findByPk(menuId, {
        transaction: t,
        lock: t.LOCK.UPDATE // Row-level lock for ACID
      });

      if (!menu || !menu.isActive) {
        throw new Error('Menu not found or inactive');
      }

      // Get cafeteria separately if needed
      const cafeteria = await Cafeteria.findByPk(menu.cafeteriaId, {
        transaction: t
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

      // For non-scholarship students, check wallet balance and deduct immediately
      let newBalance = parseFloat(student.walletBalance || 0);
      const mealPrice = parseFloat(menu.price || 0);
      
      if (!student.isScholarship) {
        if (newBalance < mealPrice) {
          throw new Error(`Insufficient wallet balance. Required: ${mealPrice.toFixed(2)}, Available: ${newBalance.toFixed(2)}`);
        }

        // Deduct money from wallet immediately
        newBalance = newBalance - mealPrice;
        await student.update({
          walletBalance: newBalance
        }, { transaction: t });

        // Create transaction record
        await Transaction.create({
          studentId,
          type: 'meal_payment',
          amount: mealPrice,
          balanceBefore: parseFloat(student.walletBalance || 0),
          balanceAfter: newBalance,
          description: `Payment for ${menu.mealType} - ${menu.mainCourse}`,
          referenceId: null, // Will be updated after reservation is created
          referenceType: 'meal_reservation'
        }, { transaction: t });
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
        amountPaid: student.isScholarship ? 0 : mealPrice // Already charged
      }, { transaction: t });

      // Update transaction with reservation ID (find the most recent one for this student)
      if (!student.isScholarship) {
        const latestTransaction = await Transaction.findOne({
          where: {
            studentId,
            type: 'meal_payment',
            referenceId: null,
            referenceType: 'meal_reservation'
          },
          order: [['createdAt', 'DESC']],
          transaction: t
        });

        if (latestTransaction) {
          await latestTransaction.update(
            { referenceId: reservation.id },
            { transaction: t }
          );
        }
      }

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
          },
          {
            model: User,
            as: 'student',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Send notification (non-blocking)
      if (reservationWithDetails.student) {
        const userName = `${reservationWithDetails.student.firstName} ${reservationWithDetails.student.lastName}`;
        notificationService.sendMealReservationConfirmation(
          reservationWithDetails,
          reservationWithDetails.student.email,
          userName
        ).catch(err => logger.error('Failed to send reservation confirmation email:', err));
      }

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
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'pending') {
        throw new Error(`Cannot cancel reservation with status: ${reservation.status}`);
      }

      // Get menu separately
      const menu = await MealMenu.findByPk(reservation.menuId, {
        transaction: t
      });

      if (!menu) {
        throw new Error('Menu not found');
      }

      // Check if meal date is still in the future (allow cancel up to 1 hour before meal)
      const menuDate = new Date(menu.menuDate);
      const now = new Date();
      
      // Simple check: cannot cancel on the same day
      if (menuDate.toDateString() === now.toDateString()) {
        throw new Error('Cannot cancel reservation on the same day of the meal');
      }

      // Get student profile for refund
      const student = await Student.findOne({
        where: { userId: studentId },
        transaction: t
      });

      if (!student) {
        throw new Error('Student profile not found');
      }

      // Refund money for non-scholarship students (if payment was made)
      if (!reservation.isScholarshipMeal && reservation.amountPaid > 0) {
        const currentBalance = parseFloat(student.walletBalance || 0);
        const refundAmount = parseFloat(reservation.amountPaid || 0);
        const newBalance = currentBalance + refundAmount;

        // Update student wallet balance
        await student.update({
          walletBalance: newBalance
        }, { transaction: t });

        // Create refund transaction record
        await Transaction.create({
          studentId,
          type: 'refund',
          amount: refundAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Refund for cancelled meal reservation - ${menu.mealType} - ${menu.mainCourse}`,
          referenceId: reservation.id,
          referenceType: 'meal_reservation'
        }, { transaction: t });
      }

      // Update reservation status
      await reservation.update({ status: 'cancelled' }, { transaction: t });

      // Decrement reserved count
      await menu.decrement('reservedCount', { transaction: t });

      await t.commit();

      // Get user info for notification
      const user = await User.findByPk(studentId, {
        attributes: ['id', 'firstName', 'lastName', 'email']
      });

      // Send cancellation notification (non-blocking)
      if (user) {
        const userName = `${user.firstName} ${user.lastName}`;
        notificationService.sendMealReservationCancellation(
          reservation.toJSON(),
          user.email,
          userName
        ).catch(err => logger.error('Failed to send cancellation email:', err));
      }

      return reservation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Use a meal reservation (scan QR code)
   * Money is already deducted at reservation time
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
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!reservation) {
        throw new Error('Reservation not found or invalid QR code');
      }

      if (reservation.status !== 'pending') {
        throw new Error(`Cannot use reservation with status: ${reservation.status}`);
      }

      // Get menu separately
      const menu = await MealMenu.findByPk(reservation.menuId, {
        transaction: t
      });

      if (!menu) {
        throw new Error('Menu not found');
      }

      // Get student profile separately
      const studentProfile = await Student.findOne({
        where: { userId: reservation.studentId },
        transaction: t
      });

      if (!studentProfile) {
        throw new Error('Student profile not found');
      }

      // Check if meal is for today
      const menuDate = new Date(menu.menuDate);
      const today = new Date();
      menuDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (menuDate.getTime() !== today.getTime()) {
        throw new Error('This reservation is not valid for today');
      }

      // Money is already deducted at reservation time, just mark as used
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

  /**
   * Get all active cafeterias
   * @returns {Promise<Array>}
   */
  async getCafeterias() {
    const cafeterias = await Cafeteria.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'location', 'capacity', 'openingTime', 'closingTime'],
      order: [['name', 'ASC']]
    });

    return cafeterias;
  }

  /**
   * Get menu by ID
   * @param {string} menuId
   * @returns {Promise<Object>}
   */
  async getMenuById(menuId) {
    const menu = await MealMenu.findByPk(menuId, {
      include: [
        {
          model: Cafeteria,
          as: 'cafeteria',
          attributes: ['id', 'name', 'location']
        }
      ]
    });

    if (!menu) {
      throw new Error('Menu not found');
    }

    const menuData = menu.toJSON();
    menuData.availableCapacity = Math.max(0, (menu.availableQuota || 0) - (menu.reservedCount || 0));
    
    return menuData;
  }

  /**
   * Create a new meal menu
   * @param {Object} menuData
   * @returns {Promise<Object>}
   */
  async createMenu(menuData) {
    const menu = await MealMenu.create(menuData);
    return await this.getMenuById(menu.id);
  }

  /**
   * Update a meal menu
   * @param {string} menuId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateMenu(menuId, updateData) {
    const menu = await MealMenu.findByPk(menuId);
    
    if (!menu) {
      throw new Error('Menu not found');
    }

    // Check if menu has reservations
    if (menu.reservedCount > 0 && (updateData.availableQuota !== undefined || updateData.price !== undefined)) {
      throw new Error('Cannot modify menu with existing reservations');
    }

    await menu.update(updateData);
    return await this.getMenuById(menuId);
  }

  /**
   * Delete a meal menu (soft delete)
   * @param {string} menuId
   * @returns {Promise<void>}
   */
  async deleteMenu(menuId) {
    const menu = await MealMenu.findByPk(menuId);
    
    if (!menu) {
      throw new Error('Menu not found');
    }

    // Check if menu has reservations
    if (menu.reservedCount > 0) {
      throw new Error('Cannot delete menu with existing reservations');
    }

    await menu.update({ isActive: false });
  }
}

module.exports = new MealService();

