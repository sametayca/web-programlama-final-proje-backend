const { Course, CoursePrerequisite } = require('../models');
const { Op } = require('sequelize');

class PrerequisiteService {
  /**
   * Recursively check if student has completed all prerequisites
   * @param {string} courseId - Course ID to check prerequisites for
   * @param {string} studentId - Student ID
   * @param {Set} visited - Set to track visited courses (prevent circular dependencies)
   * @returns {Promise<{satisfied: boolean, missing: Array}>}
   */
  async checkPrerequisites(courseId, studentId, visited = new Set()) {
    if (visited.has(courseId)) {
      // Circular dependency detected, skip
      return { satisfied: true, missing: [] };
    }

    visited.add(courseId);

    // Get direct prerequisites
    const prerequisites = await CoursePrerequisite.findAll({
      where: { courseId },
      include: [{
        model: Course,
        as: 'prerequisite',
        attributes: ['id', 'code', 'name']
      }]
    });

    if (prerequisites.length === 0) {
      return { satisfied: true, missing: [] };
    }

    const { Enrollment, CourseSection } = require('../models');
    const missing = [];

    for (const prereq of prerequisites) {
      // Get all sections for this prerequisite course
      const prerequisiteSections = await CourseSection.findAll({
        where: {
          courseId: prereq.prerequisiteCourseId
        },
        attributes: ['id']
      });
      const sectionIds = prerequisiteSections.map(s => s.id);

      if (sectionIds.length === 0) {
        missing.push({
          courseId: prereq.prerequisiteCourseId,
          code: prereq.prerequisite?.code,
          name: prereq.prerequisite?.name
        });
        continue;
      }

      // Check if student has completed this prerequisite
      const enrollment = await Enrollment.findOne({
        where: {
          studentId,
          sectionId: { [Op.in]: sectionIds },
          status: 'completed',
          letterGrade: {
            [Op.in]: ['A', 'B', 'C', 'D']
          }
        }
      });

      if (!enrollment) {
        missing.push({
          courseId: prereq.prerequisiteCourseId,
          code: prereq.prerequisite?.code,
          name: prereq.prerequisite?.name
        });
      } else {
        // Recursively check prerequisites of this prerequisite
        const result = await this.checkPrerequisites(
          prereq.prerequisiteCourseId,
          studentId,
          visited
        );
        if (!result.satisfied) {
          missing.push(...result.missing);
        }
      }
    }

    return {
      satisfied: missing.length === 0,
      missing
    };
  }
}

module.exports = new PrerequisiteService();

