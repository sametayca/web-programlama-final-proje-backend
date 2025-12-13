const { Enrollment, CourseSection } = require('../models');

class GradeCalculationService {
  /**
   * Calculate letter grade from numeric grade
   * @param {number} numericGrade - Grade from 0-100
   * @returns {string} Letter grade (A, B, C, D, F)
   */
  calculateLetterGrade(numericGrade) {
    if (numericGrade >= 90) return 'A';
    if (numericGrade >= 80) return 'B';
    if (numericGrade >= 70) return 'C';
    if (numericGrade >= 60) return 'D';
    return 'F';
  }

  /**
   * Calculate grade point from letter grade
   * @param {string} letterGrade - Letter grade (A, B, C, D, F)
   * @returns {number} Grade point (0.00-4.00)
   */
  calculateGradePoint(letterGrade) {
    const gradePoints = {
      'A': 4.00,
      'B': 3.00,
      'C': 2.00,
      'D': 1.00,
      'F': 0.00,
      'I': null, // Incomplete
      'W': null  // Withdrawn
    };
    return gradePoints[letterGrade] ?? null;
  }

  /**
   * Calculate final grade from midterm and final
   * @param {number} midtermGrade - Midterm grade (0-100)
   * @param {number} finalGrade - Final grade (0-100)
   * @param {Object} weights - { midterm: 0.4, final: 0.6 }
   * @returns {number} Final numeric grade
   */
  calculateFinalGrade(midtermGrade, finalGrade, weights = { midterm: 0.4, final: 0.6 }) {
    if (midtermGrade === null || finalGrade === null) {
      return null;
    }
    return (midtermGrade * weights.midterm) + (finalGrade * weights.final);
  }

  /**
   * Calculate GPA for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<number>} GPA (0.00-4.00)
   */
  async calculateGPA(studentId) {
    const enrollments = await Enrollment.findAll({
      where: {
        studentId,
        status: 'completed',
        gradePoint: { [Op.ne]: null }
      },
      include: [{
        model: CourseSection,
        as: 'section',
        include: [{
          model: require('../models').Course,
          as: 'course',
          attributes: ['credits']
        }]
      }]
    });

    let totalPoints = 0;
    let totalCredits = 0;

    for (const enrollment of enrollments) {
      const credits = enrollment.section?.course?.credits || 0;
      const gradePoint = parseFloat(enrollment.gradePoint) || 0;
      
      totalPoints += gradePoint * credits;
      totalCredits += credits;
    }

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  /**
   * Calculate CGPA (Cumulative GPA) for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<number>} CGPA (0.00-4.00)
   */
  async calculateCGPA(studentId) {
    // CGPA is same as GPA for now (all completed courses)
    return await this.calculateGPA(studentId);
  }

  /**
   * Generate transcript for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>}
   */
  async generateTranscript(studentId) {
    const enrollments = await Enrollment.findAll({
      where: {
        studentId,
        status: { [Op.in]: ['completed', 'enrolled'] }
      },
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

    const transcript = enrollments.map(enrollment => ({
      courseId: enrollment.section?.course?.id,
      courseCode: enrollment.section?.course?.code,
      courseName: enrollment.section?.course?.name,
      credits: enrollment.section?.course?.credits,
      semester: enrollment.section?.semester,
      year: enrollment.section?.year,
      midtermGrade: enrollment.midtermGrade,
      finalGrade: enrollment.finalGrade,
      letterGrade: enrollment.letterGrade,
      gradePoint: enrollment.gradePoint,
      status: enrollment.status
    }));

    const cgpa = await this.calculateCGPA(studentId);
    const totalCredits = transcript.reduce((sum, course) => sum + (course.credits || 0), 0);

    return {
      transcript,
      cgpa,
      totalCredits
    };
  }
}

const { Op } = require('sequelize');
module.exports = new GradeCalculationService();

