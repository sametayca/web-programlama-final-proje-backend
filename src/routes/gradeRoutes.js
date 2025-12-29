const express = require('express');
const router = express.Router();
const { Enrollment, CourseSection, User, Course } = require('../models');
const { Op } = require('sequelize');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const gradeCalculationService = require('../services/gradeCalculationService');
const notificationService = require('../services/notificationService');

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
      const PDFDocument = require('pdfkit');
      const path = require('path');
      const studentId = req.user.id;
      const transcript = await gradeCalculationService.generateTranscript(studentId);
      const user = await User.findByPk(studentId, {
        include: [{
          model: require('../models').Student,
          as: 'studentProfile',
          include: [{
            model: require('../models').Department,
            as: 'department',
            attributes: ['name', 'code']
          }]
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Create PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Font Setup with Robust Fallback
      let fontRegular = 'Helvetica';
      let fontBold = 'Helvetica-Bold';

      try {
        const fontRegularPath = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf');
        const fontBoldPath = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf');
        const fs = require('fs');

        if (fs.existsSync(fontRegularPath) && fs.existsSync(fontBoldPath)) {
          doc.registerFont('Roboto', fontRegularPath);
          doc.registerFont('Roboto-Bold', fontBoldPath);
          fontRegular = 'Roboto';
          fontBold = 'Roboto-Bold';
        } else {
          console.warn('Custom fonts not found, using Helvetica');
        }
      } catch (fontError) {
        console.error('Error registering fonts:', fontError);
        // Continue with Helvetica
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=transcript-${user.studentProfile?.studentNumber || user.email}.pdf`);

      // Pipe PDF to response
      doc.pipe(res);

      // University Header
      doc.fontSize(20)
        .font(fontBold)
        .text('AKILLI KAMPÜS YÖNETİM PLATFORMU', { align: 'center' });

      doc.moveDown(0.5);
      doc.moveDown(0.5);
      doc.fontSize(14)
        .font(fontRegular)
        .text('ACADEMIC TRANSCRIPT', { align: 'center' });

      doc.moveDown(1);

      // Student Information
      doc.fontSize(12)
        .font(fontBold)
        .text('Student Information', { underline: true });

      doc.moveDown(0.3);
      doc.font(fontRegular)
        .fontSize(10)
        .text(`Name: ${user.firstName} ${user.lastName}`, { indent: 20 });
      doc.text(`Student Number: ${user.studentProfile?.studentNumber || 'N/A'}`, { indent: 20 });
      doc.text(`Email: ${user.email}`, { indent: 20 });
      doc.text(`Department: ${user.studentProfile?.department?.name || 'N/A'}`, { indent: 20 });
      doc.text(`CGPA: ${transcript.cgpa.toFixed(2)}`, { indent: 20 });
      doc.text(`Total Credits: ${transcript.totalCredits}`, { indent: 20 });

      doc.moveDown(1);

      // Transcript Table Header
      doc.fontSize(12)
        .font(fontBold)
        .text('Academic Record', { underline: true });

      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const leftMargin = 50;
      // Total page width ~595. Margins 50+50=100. Printable: 495.
      // Adjusted widths to fit page:
      const colWidths = {
        code: 60,
        name: 180,
        credits: 40,
        semester: 60,
        year: 40,
        grade: 40,
        point: 40
      };

      doc.fontSize(9)
        .font(fontBold);

      let x = leftMargin;
      doc.text('Code', x, tableTop);
      x += colWidths.code;
      doc.text('Course Name', x, tableTop);
      x += colWidths.name;
      doc.text('Credits', x, tableTop);
      x += colWidths.credits;
      doc.text('Semester', x, tableTop);
      x += colWidths.semester;
      doc.text('Year', x, tableTop);
      x += colWidths.year;
      doc.text('Grade', x, tableTop);
      x += colWidths.grade;
      doc.text('Point', x, tableTop);

      // Draw line under header
      doc.moveTo(leftMargin, tableTop + 15)
        .lineTo(leftMargin + Object.values(colWidths).reduce((a, b) => a + b, 0), tableTop + 15)
        .stroke();

      doc.moveDown(0.3);

      // Transcript rows
      doc.font(fontRegular)
        .fontSize(9);

      transcript.transcript.forEach((course, index) => {
        const rowY = doc.y;

        // Check if we need a new page
        if (rowY > 700) {
          doc.addPage();
          doc.y = 50;
        }

        x = leftMargin;
        doc.text(course.courseCode || 'N/A', x, rowY, { width: colWidths.code, ellipsis: true });
        x += colWidths.code;
        doc.text(course.courseName || 'N/A', x, rowY, { width: colWidths.name, ellipsis: true });
        x += colWidths.name;
        doc.text(String(course.credits || 0), x, rowY, { width: colWidths.credits });
        x += colWidths.credits;
        doc.text(course.semester || 'N/A', x, rowY, { width: colWidths.semester });
        x += colWidths.semester;
        doc.text(String(course.year || 'N/A'), x, rowY, { width: colWidths.year });
        x += colWidths.year;
        doc.text(course.letterGrade || '-', x, rowY, { width: colWidths.grade });
        x += colWidths.grade;
        doc.text(course.gradePoint ? course.gradePoint.toFixed(2) : '-', x, rowY, { width: colWidths.point });

        doc.moveDown(0.4);
      });

      // Footer
      doc.moveDown(1);
      doc.moveDown(1);
      doc.moveDown(1);
      doc.fontSize(8)
        .font(fontRegular)
        .text('This transcript is generated electronically and is valid without signature.', { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
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

      // Send notification to student about grade entry
      try {
        const section = await CourseSection.findByPk(enrollment.sectionId, {
          include: [{ model: Course, as: 'course', attributes: ['code', 'name'] }]
        });

        const courseName = section?.course?.name || 'Ders';
        const courseCode = section?.course?.code || '';

        let gradeMessage = '';
        if (midtermGrade !== undefined) {
          gradeMessage = `Vize notunuz: ${midtermGrade}`;
        }
        if (finalGrade !== undefined) {
          gradeMessage = `Final notunuz: ${finalGrade}`;
          if (letterGrade) {
            gradeMessage += ` (Harf Notu: ${letterGrade})`;
          }
        }

        await notificationService.createNotification({
          userId: enrollment.studentId,
          title: `📝 ${courseCode} - Not Girişi Yapıldı`,
          message: `${courseName} dersi için ${gradeMessage}`,
          category: 'academic',
          type: 'info',
          link: '/grades'
        });
      } catch (notifError) {
        console.error('Failed to send grade notification:', notifError);
        // Don't fail the main operation
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

