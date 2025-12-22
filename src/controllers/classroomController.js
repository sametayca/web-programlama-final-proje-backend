const { Classroom } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

/**
 * @desc    Get all classrooms with filters
 * @route   GET /api/v1/classrooms
 * @access  Private
 */
exports.listClassrooms = async (req, res) => {
  try {
    const { building, capacity } = req.query;
    
    const where = {
      isActive: true
    };

    if (building && building !== 'all') {
      where.building = building;
    }

    if (capacity && capacity !== 'all') {
      const capacityNum = parseInt(capacity);
      if (!isNaN(capacityNum)) {
        where.capacity = {
          [Op.gte]: capacityNum
        };
      }
    }

    const classrooms = await Classroom.findAll({
      where,
      attributes: ['id', 'building', 'roomNumber', 'capacity', 'featuresJson'],
      order: [['building', 'ASC'], ['roomNumber', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (error) {
    logger.error('Error in listClassrooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch classrooms'
    });
  }
};

/**
 * @desc    Get single classroom by ID
 * @route   GET /api/v1/classrooms/:id
 * @access  Private
 */
exports.getClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findOne({
      where: { id, isActive: true },
      attributes: ['id', 'building', 'roomNumber', 'capacity', 'latitude', 'longitude', 'featuresJson']
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classroom
    });
  } catch (error) {
    logger.error('Error in getClassroom:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch classroom'
    });
  }
};

