const express = require('express');
const router = express.Router();
const { Enrollment, CourseSection, User } = require('../models');
const { Op } = require('sequelize');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const gradeCalculationService = require('../services/gradeCalculationService');

// Get my grades (Student only)
router.get(
  '/my-grades',
  authGuard,
  roleGuard('student'),
  [
    query('semester').optional().isIn(['fall', 'spring', 'summer']).withMessage('Invalid semester'),
    query('year').optional().isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { semester, year } = req.query;
      const whereClause = { studentId: req.user.id };

      if (semester || year) {
        whereClause.sectionId = {
          [Op.in]: await CourseSection.findAll({
            where: {
              ...(semester && { semester }),
              ...(year && { year: parseInt(year) })
            },
            attributes: ['id']
          }).then(sections => sections.map(s => s.id))
        };
      }

      const enrollments = await Enrollment.findAll({
        where: whereClause,
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{
            model: require('../models').Course,
            as: 'course',
            attributes: ['id', 'code', 'name', 'credits']
          }]
        }],
        order: [
          ['section', 'year', 'DESC'],
          ['section', 'semester', 'DESC']
        ]
      });

      const gpa = await gradeCalculationService.calculateGPA(req.user.id);
      const totalCredits = enrollments
        .filter(e => e.status === 'completed')
        .reduce((sum, e) => sum + (e.section?.course?.credits || 0), 0);

      res.json({
        success: true,
        data: {
          enrollments,
          gpa,
          totalCredits
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

// Get transcript (JSON) (Student only)
router.get(
  '/transcript',
  authGuard,
  roleGuard('student'),
  async (req, res) => {
    try {
      const transcript = await gradeCalculationService.generateTranscript(req.user.id);
      res.json({
        success: true,
        data: transcript
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get transcript (PDF) (Student only)
router.get(
  '/transcript/pdf',
  authGuard,
  roleGuard('student'),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const transcript = await gradeCalculationService.generateTranscript(studentId);
      const user = await User.findByPk(studentId, {
        include: [{
          model: require('../models').Student,
          as: 'studentProfile',
          attributes: ['studentNumber']
        }]
      });

      // For now, return JSON. PDF generation can be added later with PDFKit
      res.json({
        success: true,
        message: 'PDF generation will be implemented with PDFKit package',
        data: {
          student: {
            name: `${user.firstName} ${user.lastName}`,
            studentNumber: user.studentProfile?.studentNumber || 'N/A',
            email: user.email
          },
          transcript,
          cgpa: transcript.cgpa
        }
      });

      // TODO: Install pdfkit and implement PDF generation
      // const PDFDocument = require('pdfkit');
      // const doc = new PDFDocument({ margin: 50 });
      // ... PDF generation code ...
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Enter grades (Faculty only)
router.post(
  '/',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    body('enrollmentId').isUUID().withMessage('Invalid enrollment ID'),
    body('midtermGrade').optional().isFloat({ min: 0, max: 100 }).withMessage('Midterm grade must be between 0 and 100'),
    body('finalGrade').optional().isFloat({ min: 0, max: 100 }).withMessage('Final grade must be between 0 and 100'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { enrollmentId, midtermGrade, finalGrade } = req.body;

      const enrollment = await Enrollment.findByPk(enrollmentId, {
        include: [{
          model: CourseSection,
          as: 'section',
          attributes: ['id', 'instructorId']
        }]
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Enrollment not found'
        });
      }

      // Check authorization
      if (req.user.role === 'faculty' && enrollment.section.instructorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to enter grades for this section'
        });
      }

      // Calculate final grade if both midterm and final are provided
      let finalNumericGrade = null;
      if (midtermGrade !== null && midtermGrade !== undefined && 
          finalGrade !== null && finalGrade !== undefined) {
        finalNumericGrade = gradeCalculationService.calculateFinalGrade(
          midtermGrade,
          finalGrade
        );
      } else if (finalGrade !== null && finalGrade !== undefined) {
        finalNumericGrade = finalGrade;
      }

      // Calculate letter grade and grade point
      let letterGrade = null;
      let gradePoint = null;

      if (finalNumericGrade !== null) {
        letterGrade = gradeCalculationService.calculateLetterGrade(finalNumericGrade);
        gradePoint = gradeCalculationService.calculateGradePoint(letterGrade);
      }

      // Update enrollment
      await enrollment.update({
        midtermGrade: midtermGrade !== undefined ? midtermGrade : enrollment.midtermGrade,
        finalGrade: finalGrade !== undefined ? finalGrade : enrollment.finalGrade,
        letterGrade,
        gradePoint
      });

      // If grades are complete, mark as completed
      if (letterGrade && ['A', 'B', 'C', 'D', 'F'].includes(letterGrade)) {
        await enrollment.update({ status: 'completed' });
      }

      res.json({
        success: true,
        message: 'Grades updated successfully',
        data: enrollment
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

