const { AttendanceSession, AttendanceRecord } = require('../models');
const { Op } = require('sequelize');

class AttendanceService {
  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if student has already checked in for this session
   * @param {string} sessionId - Attendance session ID
   * @param {string} studentId - Student ID
   * @returns {Promise<boolean>}
   */
  async hasCheckedIn(sessionId, studentId) {
    const record = await AttendanceRecord.findOne({
      where: { sessionId, studentId }
    });
    return !!record;
  }

  /**
   * Create attendance record with GPS spoofing detection
   * @param {string} sessionId - Attendance session ID
   * @param {string} studentId - Student ID
   * @param {number} latitude - Student's GPS latitude
   * @param {number} longitude - Student's GPS longitude
   * @param {number} accuracy - GPS accuracy in meters
   * @returns {Promise<{record: Object, distance: number, isFlagged: boolean, flagReason: string}>}
   */
  async createAttendanceRecord(sessionId, studentId, latitude, longitude, accuracy = null) {
    // Get session details
    const session = await AttendanceSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Attendance session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Attendance session is not active');
    }

    // Check if already checked in
    if (await this.hasCheckedIn(sessionId, studentId)) {
      throw new Error('You have already checked in for this session');
    }

    // Calculate distance from classroom center
    const distance = this.calculateDistance(
      parseFloat(session.latitude),
      parseFloat(session.longitude),
      latitude,
      longitude
    );

    // GPS Spoofing Detection
    const geofenceRadius = parseFloat(session.geofenceRadius);
    const accuracyBuffer = accuracy ? parseFloat(accuracy) : 5; // Default 5m buffer
    const allowedDistance = geofenceRadius + accuracyBuffer;

    let isFlagged = false;
    let flagReason = null;

    if (distance > allowedDistance) {
      isFlagged = true;
      flagReason = `Distance from classroom center (${distance.toFixed(2)}m) exceeds allowed range (${allowedDistance.toFixed(2)}m)`;
    }

    // Create attendance record
    const record = await AttendanceRecord.create({
      sessionId,
      studentId,
      latitude,
      longitude,
      accuracy,
      distanceFromCenter: distance,
      isFlagged,
      flagReason
    });

    return {
      record,
      distance,
      isFlagged,
      flagReason
    };
  }

  /**
   * Calculate attendance statistics for a student in a section
   * @param {string} sectionId - Section ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>}
   */
  async calculateAttendanceStats(sectionId, studentId) {
    const { CourseSection, ExcuseRequest } = require('../models');

    // Get all sessions for this section
    const sessions = await AttendanceSession.findAll({
      where: { sectionId },
      attributes: ['id']
    });
    const sessionIds = sessions.map(s => s.id);

    // Get attendance records
    const records = await AttendanceRecord.findAll({
      where: {
        sessionId: { [Op.in]: sessionIds },
        studentId
      }
    });

    // Get excused absences
    const excusedRequests = await ExcuseRequest.findAll({
      where: {
        sessionId: { [Op.in]: sessionIds },
        studentId,
        status: 'approved'
      }
    });

    const totalSessions = sessions.length;
    const attendedSessions = records.length;
    const excusedSessions = excusedRequests.length;
    const absentSessions = totalSessions - attendedSessions - excusedSessions;
    const attendancePercentage = totalSessions > 0 
      ? ((attendedSessions / totalSessions) * 100) 
      : 0;

    // Determine status
    let status = 'ok';
    if (attendancePercentage < 70) {
      status = 'critical';
    } else if (attendancePercentage < 80) {
      status = 'warning';
    }

    return {
      totalSessions,
      attendedSessions,
      excusedSessions,
      absentSessions,
      attendancePercentage,
      status
    };
  }
}

module.exports = new AttendanceService();

