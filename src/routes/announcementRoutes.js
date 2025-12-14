const express = require('express');
const router = express.Router();
const { Announcement, User } = require('../models');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all announcements (with pagination, filtering, search)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('targetAudience').optional().isIn(['all', 'students', 'faculty', 'staff']).withMessage('Invalid target audience'),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
    validateRequest
  ],
  authGuard,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { search, targetAudience, priority } = req.query;
      const userRole = req.user.role;

      const whereClause = { 
        isActive: true,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      };

      // Filter by target audience
      if (targetAudience) {
        whereClause[Op.or] = [
          { targetAudience: 'all' },
          { targetAudience: targetAudience }
        ];
      } else {
        // Default: show announcements for user's role
        whereClause[Op.or] = [
          { targetAudience: 'all' },
          { targetAudience: userRole === 'student' ? 'students' : userRole === 'faculty' ? 'faculty' : 'staff' }
        ];
      }

      if (priority) {
        whereClause.priority = priority;
      }

      if (search) {
        whereClause[Op.and] = [
          ...(whereClause[Op.and] || []),
          {
            [Op.or]: [
              { title: { [Op.iLike]: `%${search}%` } },
              { content: { [Op.iLike]: `%${search}%` } }
            ]
          }
        ];
      }

      const { count, rows: announcements } = await Announcement.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
        }],
        limit,
        offset,
        order: [
          ['isPinned', 'DESC'],
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      res.json({
        success: true,
        data: {
          announcements,
          pagination: {
            page,
            limit,
            totalAnnouncements: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get announcement by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid announcement ID'),
    validateRequest
  ],
  authGuard,
  async (req, res) => {
    try {
      const announcement = await Announcement.findByPk(req.params.id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
        }]
      });

      if (!announcement) {
        return res.status(404).json({
          success: false,
          error: 'Duyuru bulunamadı'
        });
      }

      if (!announcement.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Duyuru bulunamadı'
        });
      }

      // Check if expired
      if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
        return res.status(404).json({
          success: false,
          error: 'Duyuru süresi dolmuş'
        });
      }

      res.json({
        success: true,
        data: announcement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Create new announcement (admin/faculty only)
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Başlık gereklidir').isLength({ min: 1, max: 200 }).withMessage('Başlık 1-200 karakter arasında olmalıdır'),
    body('content').trim().notEmpty().withMessage('İçerik gereklidir'),
    body('targetAudience').optional().isIn(['all', 'students', 'faculty', 'staff']).withMessage('Geçersiz hedef kitle'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Geçersiz öncelik'),
    body('isPinned').optional().isBoolean().withMessage('isPinned boolean olmalıdır'),
    body('expiresAt').optional().isISO8601().withMessage('Geçersiz tarih formatı'),
    validateRequest
  ],
  authGuard,
  async (req, res) => {
    try {
      // Only admin and faculty can create announcements
      if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
        return res.status(403).json({
          success: false,
          error: 'Duyuru oluşturma yetkiniz yok'
        });
      }

      const announcement = await Announcement.create({
        title: req.body.title,
        content: req.body.content,
        authorId: req.user.id,
        targetAudience: req.body.targetAudience || 'all',
        priority: req.body.priority || 'normal',
        isPinned: req.body.isPinned || false,
        expiresAt: req.body.expiresAt || null
      });

      const announcementWithAuthor = await Announcement.findByPk(announcement.id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
        }]
      });

      res.status(201).json({
        success: true,
        data: announcementWithAuthor
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update announcement (admin/faculty or author only)
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid announcement ID'),
    body('title').optional().trim().notEmpty().withMessage('Başlık boş olamaz').isLength({ min: 1, max: 200 }).withMessage('Başlık 1-200 karakter arasında olmalıdır'),
    body('content').optional().trim().notEmpty().withMessage('İçerik boş olamaz'),
    body('targetAudience').optional().isIn(['all', 'students', 'faculty', 'staff']).withMessage('Geçersiz hedef kitle'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Geçersiz öncelik'),
    body('isPinned').optional().isBoolean().withMessage('isPinned boolean olmalıdır'),
    body('isActive').optional().isBoolean().withMessage('isActive boolean olmalıdır'),
    body('expiresAt').optional().isISO8601().withMessage('Geçersiz tarih formatı'),
    validateRequest
  ],
  authGuard,
  async (req, res) => {
    try {
      const announcement = await Announcement.findByPk(req.params.id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          error: 'Duyuru bulunamadı'
        });
      }

      // Check authorization: admin, faculty, or author
      if (req.user.role !== 'admin' && req.user.role !== 'faculty' && announcement.authorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Bu duyuruyu düzenleme yetkiniz yok'
        });
      }

      await announcement.update({
        title: req.body.title !== undefined ? req.body.title : announcement.title,
        content: req.body.content !== undefined ? req.body.content : announcement.content,
        targetAudience: req.body.targetAudience !== undefined ? req.body.targetAudience : announcement.targetAudience,
        priority: req.body.priority !== undefined ? req.body.priority : announcement.priority,
        isPinned: req.body.isPinned !== undefined ? req.body.isPinned : announcement.isPinned,
        isActive: req.body.isActive !== undefined ? req.body.isActive : announcement.isActive,
        expiresAt: req.body.expiresAt !== undefined ? req.body.expiresAt : announcement.expiresAt
      });

      const updatedAnnouncement = await Announcement.findByPk(announcement.id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
        }]
      });

      res.json({
        success: true,
        data: updatedAnnouncement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Delete announcement (admin/faculty or author only)
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid announcement ID'),
    validateRequest
  ],
  authGuard,
  async (req, res) => {
    try {
      const announcement = await Announcement.findByPk(req.params.id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          error: 'Duyuru bulunamadı'
        });
      }

      // Check authorization: admin, faculty, or author
      if (req.user.role !== 'admin' && req.user.role !== 'faculty' && announcement.authorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Bu duyuruyu silme yetkiniz yok'
        });
      }

      // Soft delete: set isActive to false
      await announcement.update({ isActive: false });

      res.json({
        success: true,
        message: 'Duyuru başarıyla silindi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;
