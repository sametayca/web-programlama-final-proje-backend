const {
    User,
    Student,
    Faculty,
    Course,
    CourseSection,
    Enrollment,
    AttendanceSession,
    AttendanceRecord,
    MealReservation,
    Event,
    EventRegistration,
    Department,
    sequelize
} = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Get dashboard statistics
 * GET /api/v1/analytics/dashboard
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total users
        const totalUsers = await User.count();

        // Active users today (users who logged in or updated today)
        const activeUsersToday = await User.count({
            where: {
                updatedAt: {
                    [Op.gte]: today
                }
            }
        });

        // Total courses
        const totalCourses = await Course.count();

        // Total enrollments (active)
        const totalEnrollments = await Enrollment.count({
            where: { status: 'enrolled' }
        });

        // Calculate attendance rate
        let attendanceRate = 0;
        try {
            const totalSessions = await AttendanceSession.count();
            const presentRecords = await AttendanceRecord.count();

            // Approximate total expected records = total sessions * total active enrollments
            // This is an estimation since not all students are in all sessions, but better than partial logic
            const totalExpected = totalSessions * totalEnrollments;

            if (totalExpected > 0) {
                attendanceRate = ((presentRecords / totalExpected) * 100).toFixed(1);
            }
        } catch (e) {
            console.error('Attendance rate calculation error:', e.message);
        }

        // Meal reservations today
        let mealReservationsToday = 0;
        try {
            mealReservationsToday = await MealReservation.count({
                where: {
                    reservationDate: {
                        [Op.gte]: today
                    }
                }
            });
        } catch (e) {
            console.error('Meal reservations count error:', e.message);
        }

        // Upcoming events
        let upcomingEvents = 0;
        try {
            upcomingEvents = await Event.count({
                where: {
                    startDate: {
                        [Op.gte]: today
                    }
                }
            });
        } catch (e) {
            console.error('Upcoming events count error:', e.message);
        }

        // System health - check database connection
        let systemHealth = 'healthy';
        try {
            await sequelize.authenticate();
        } catch (e) {
            systemHealth = 'degraded';
        }

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsersToday,
                totalCourses,
                totalEnrollments,
                attendanceRate: parseFloat(attendanceRate),
                mealReservationsToday,
                upcomingEvents,
                systemHealth
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get academic performance analytics
 * GET /api/v1/analytics/academic-performance
 */
exports.getAcademicPerformance = async (req, res) => {
    try {
        // Average GPA by department
        let averageGpaByDept = [];
        try {
            const gpaResults = await Student.findAll({
                attributes: [
                    'departmentId',
                    [fn('AVG', col('gpa')), 'avgGpa'],
                    [fn('COUNT', col('Student.id')), 'studentCount']
                ],
                include: [{
                    model: Department,
                    as: 'department',
                    attributes: ['name']
                }],
                group: ['departmentId', 'department.id', 'department.name'],
                raw: true,
                nest: true
            });

            averageGpaByDept = gpaResults.map(item => ({
                department: item.department?.name || 'Bilinmeyen',
                avgGpa: item.avgGpa ? parseFloat(item.avgGpa).toFixed(2) : '0.00',
                studentCount: parseInt(item.studentCount) || 0
            }));
        } catch (dbError) {
            console.error('GPA Calculation Error:', dbError.message);
        }

        // Grade distribution
        let gradeDistribution = [];
        try {
            const gradeResults = await Enrollment.findAll({
                attributes: [
                    'letterGrade',
                    [fn('COUNT', col('letterGrade')), 'count']
                ],
                where: {
                    letterGrade: { [Op.ne]: null }
                },
                group: ['letterGrade'],
                order: [[col('letterGrade'), 'ASC']]
            });

            const totalGrades = gradeResults.reduce((sum, g) => sum + parseInt(g.dataValues.count), 0);
            gradeDistribution = gradeResults.map(item => ({
                grade: item.letterGrade,
                count: parseInt(item.dataValues.count),
                percentage: totalGrades > 0 ? ((parseInt(item.dataValues.count) / totalGrades) * 100).toFixed(1) : 0
            }));
        } catch (dbError) {
            console.error('Grade Distribution Error:', dbError.message);
        }

        // Pass/Fail rates
        let passFailRates = { pass: 0, fail: 0 };
        try {
            const passingGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D'];
            const failingGrades = ['F'];

            const passCount = await Enrollment.count({
                where: { letterGrade: { [Op.in]: passingGrades } }
            });
            const failCount = await Enrollment.count({
                where: { letterGrade: { [Op.in]: failingGrades } }
            });
            const total = passCount + failCount;

            passFailRates = {
                pass: total > 0 ? ((passCount / total) * 100).toFixed(1) : 0,
                fail: total > 0 ? ((failCount / total) * 100).toFixed(1) : 0,
                passCount,
                failCount
            };
        } catch (dbError) {
            console.error('Pass/Fail Rates Error:', dbError.message);
        }

        // Top performing students (top 10 by GPA)
        let topStudents = [];
        try {
            topStudents = await Student.findAll({
                attributes: ['id', 'studentNumber', 'gpa'],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }, {
                    model: Department,
                    as: 'department',
                    attributes: ['name']
                }],
                where: {
                    gpa: { [Op.ne]: null }
                },
                order: [['gpa', 'DESC']],
                limit: 10
            });
        } catch (dbError) {
            console.error('Top Students Error:', dbError.message);
        }

        // At-risk students (GPA < 2.0)
        let atRiskStudents = [];
        try {
            atRiskStudents = await Student.findAll({
                attributes: ['id', 'studentNumber', 'gpa'],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }, {
                    model: Department,
                    as: 'department',
                    attributes: ['name']
                }],
                where: {
                    gpa: { [Op.lt]: 2.0 }
                },
                order: [['gpa', 'ASC']],
                limit: 20
            });
        } catch (dbError) {
            console.error('At-Risk Students Error:', dbError.message);
        }

        res.json({
            success: true,
            data: {
                averageGpaByDept,
                gradeDistribution,
                passFailRates,
                topStudents: topStudents.map(s => ({
                    id: s.id,
                    studentNumber: s.studentNumber,
                    name: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'N/A',
                    email: s.user?.email,
                    department: s.department?.name || 'N/A',
                    gpa: parseFloat(s.gpa).toFixed(2)
                })),
                atRiskStudents: atRiskStudents.map(s => ({
                    id: s.id,
                    studentNumber: s.studentNumber,
                    name: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'N/A',
                    email: s.user?.email,
                    department: s.department?.name || 'N/A',
                    gpa: parseFloat(s.gpa).toFixed(2)
                }))
            }
        });
    } catch (error) {
        console.error('Academic Performance Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get attendance analytics
 * GET /api/v1/analytics/attendance
 */
exports.getAttendanceAnalytics = async (req, res) => {
    try {
        // Attendance rate by course
        let attendanceByCourse = [];
        try {
            const sessions = await AttendanceSession.findAll({
                attributes: ['id'],
                include: [{
                    model: CourseSection,
                    as: 'section',
                    attributes: ['id'],
                    include: [{
                        model: Course,
                        as: 'course',
                        attributes: ['id', 'code', 'name']
                    }]
                }]
            });

            // Group by course and calculate attendance
            const courseAttendance = {};
            for (const session of sessions) {
                if (!session.section?.course) continue;

                const courseId = session.section.course.id;
                if (!courseAttendance[courseId]) {
                    courseAttendance[courseId] = {
                        courseCode: session.section.course.code,
                        courseName: session.section.course.name,
                        totalRecords: 0,
                        presentRecords: 0
                    };
                }

                // Get total students enrolled in this section
                const totalStudents = await Enrollment.count({
                    where: {
                        sectionId: session.sectionId,
                        status: 'enrolled'
                    }
                });

                // Get present records (AttendanceRecord only exists for present students)
                const presentCount = await AttendanceRecord.count({
                    where: { sessionId: session.id }
                });

                courseAttendance[courseId].totalRecords += totalStudents;
                courseAttendance[courseId].presentRecords += presentCount;
            }

            attendanceByCourse = Object.values(courseAttendance).map(c => ({
                ...c,
                attendanceRate: c.totalRecords > 0
                    ? ((c.presentRecords / c.totalRecords) * 100).toFixed(1)
                    : 0
            })).sort((a, b) => b.attendanceRate - a.attendanceRate);
        } catch (dbError) {
            console.error('Attendance by Course Error:', dbError.message);
        }

        // Attendance trends over time (last 30 days)
        let attendanceTrends = [];
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dailyAttendance = await AttendanceSession.findAll({
                attributes: [
                    [fn('DATE', col('AttendanceSession.created_at')), 'date'],
                    [fn('COUNT', col('AttendanceSession.id')), 'sessionCount']
                ],
                where: {
                    createdAt: { [Op.gte]: thirtyDaysAgo }
                },
                group: [fn('DATE', col('AttendanceSession.created_at'))],
                order: [[fn('DATE', col('AttendanceSession.created_at')), 'ASC']],
                raw: true
            });

            attendanceTrends = dailyAttendance.map(d => ({
                date: d.date,
                sessionCount: parseInt(d.sessionCount)
            }));
        } catch (dbError) {
            console.error('Attendance Trends Error:', dbError.message);
        }

        // Students with critical absence rates (< 70%)
        let criticalAbsenceStudents = [];
        // This would require more complex calculation per student per section

        // Courses with low attendance (< 60%)
        const lowAttendanceCourses = attendanceByCourse.filter(c => parseFloat(c.attendanceRate) < 60);

        res.json({
            success: true,
            data: {
                attendanceByCourse: attendanceByCourse.slice(0, 20),
                attendanceTrends,
                criticalAbsenceStudents,
                lowAttendanceCourses
            }
        });
    } catch (error) {
        console.error('Attendance Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get meal usage analytics
 * GET /api/v1/analytics/meal-usage
 */
exports.getMealAnalytics = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Daily meal counts
        let dailyMealCounts = [];
        try {
            dailyMealCounts = await MealReservation.findAll({
                attributes: [
                    [fn('DATE', col('reservationDate')), 'date'],
                    [fn('COUNT', col('id')), 'count']
                ],
                where: {
                    reservationDate: { [Op.gte]: thirtyDaysAgo }
                },
                group: [fn('DATE', col('reservationDate'))],
                order: [[fn('DATE', col('reservationDate')), 'ASC']],
                raw: true
            });
        } catch (dbError) {
            console.error('Daily Meal Counts Error:', dbError.message);
        }

        // Meal type distribution - from MealMenu instead
        let mealTypeDistribution = [
            { mealType: 'breakfast', count: 0 },
            { mealType: 'lunch', count: 0 },
            { mealType: 'dinner', count: 0 }
        ];
        // Note: MealReservation doesn't have mealType directly, it references MealMenu

        // Status distribution (used, cancelled, etc.)
        let statusDistribution = [];
        try {
            statusDistribution = await MealReservation.findAll({
                attributes: [
                    'status',
                    [fn('COUNT', col('id')), 'count']
                ],
                group: ['status'],
                raw: true
            });
        } catch (dbError) {
            console.error('Status Distribution Error:', dbError.message);
        }

        // Peak hours analysis (by meal type)
        const peakHours = {
            breakfast: { start: '07:00', end: '09:00', peakHour: '08:00' },
            lunch: { start: '11:30', end: '14:00', peakHour: '12:30' },
            dinner: { start: '17:30', end: '20:00', peakHour: '18:30' }
        };

        // Total reservations and usage rate
        const totalReservations = await MealReservation.count();
        const usedReservations = await MealReservation.count({
            where: { status: 'used' }
        });
        const usageRate = totalReservations > 0
            ? ((usedReservations / totalReservations) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                dailyMealCounts,
                mealTypeDistribution,
                statusDistribution,
                peakHours,
                summary: {
                    totalReservations,
                    usedReservations,
                    usageRate: parseFloat(usageRate),
                    cancelledReservations: totalReservations - usedReservations
                }
            }
        });
    } catch (error) {
        console.error('Meal Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get event analytics
 * GET /api/v1/analytics/events
 */
exports.getEventAnalytics = async (req, res) => {
    try {
        // Most popular events (by registration count)
        let popularEvents = [];
        try {
            const events = await Event.findAll({
                attributes: [
                    'id', 'title', 'eventType', 'startDate', 'capacity'
                ],
                include: [{
                    model: EventRegistration,
                    as: 'registrations',
                    attributes: []
                }],
                group: ['Event.id'],
                order: [[fn('COUNT', col('registrations.id')), 'DESC']],
                limit: 10,
                subQuery: false
            });

            for (const event of events) {
                const registrationCount = await EventRegistration.count({
                    where: { eventId: event.id }
                });
                const checkedInCount = await EventRegistration.count({
                    where: { eventId: event.id, checkedIn: true }
                });

                popularEvents.push({
                    id: event.id,
                    title: event.title,
                    category: event.eventType,
                    date: event.startDate,
                    capacity: event.capacity,
                    registrationCount,
                    checkedInCount,
                    registrationRate: event.capacity > 0
                        ? ((registrationCount / event.capacity) * 100).toFixed(1)
                        : 0,
                    checkInRate: registrationCount > 0
                        ? ((checkedInCount / registrationCount) * 100).toFixed(1)
                        : 0
                });
            }
        } catch (dbError) {
            console.error('Popular Events Error:', dbError.message);
        }

        // Category breakdown
        let categoryBreakdown = [];
        try {
            categoryBreakdown = await Event.findAll({
                attributes: [
                    'eventType',
                    [fn('COUNT', col('id')), 'count']
                ],
                group: ['eventType'],
                raw: true
            });
        } catch (dbError) {
            console.error('Category Breakdown Error:', dbError.message);
        }

        // Registration trends (last 30 days)
        let registrationTrends = [];
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            registrationTrends = await EventRegistration.findAll({
                attributes: [
                    [fn('DATE', col('createdAt')), 'date'],
                    [fn('COUNT', col('id')), 'count']
                ],
                where: {
                    createdAt: { [Op.gte]: thirtyDaysAgo }
                },
                group: [fn('DATE', col('createdAt'))],
                order: [[fn('DATE', col('createdAt')), 'ASC']],
                raw: true
            });
        } catch (dbError) {
            console.error('Registration Trends Error:', dbError.message);
        }

        // Overall registration and check-in rates
        const totalRegistrations = await EventRegistration.count();
        const totalCheckedIn = await EventRegistration.count({
            where: { checkedIn: true }
        });

        res.json({
            success: true,
            data: {
                popularEvents,
                categoryBreakdown,
                registrationTrends,
                summary: {
                    totalEvents: await Event.count(),
                    upcomingEvents: await Event.count({
                        where: { startDate: { [Op.gte]: new Date() } }
                    }),
                    totalRegistrations,
                    totalCheckedIn,
                    overallCheckInRate: totalRegistrations > 0
                        ? ((totalCheckedIn / totalRegistrations) * 100).toFixed(1)
                        : 0
                }
            }
        });
    } catch (error) {
        console.error('Event Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Export analytics report
 * GET /api/v1/analytics/export/:type
 * Query params: format (excel, pdf, csv)
 */
exports.exportReport = async (req, res) => {
    try {
        const { type } = req.params;
        const format = req.query.format || 'excel';

        let data = {};
        let filename = '';

        switch (type) {
            case 'academic':
                // Get academic data
                const academicResponse = await exports.getAcademicPerformanceData();
                data = academicResponse;
                filename = `academic-report-${Date.now()}`;
                break;
            case 'attendance':
                const attendanceResponse = await exports.getAttendanceData();
                data = attendanceResponse;
                filename = `attendance-report-${Date.now()}`;
                break;
            case 'meal':
                const mealResponse = await exports.getMealData();
                data = mealResponse;
                filename = `meal-report-${Date.now()}`;
                break;
            case 'event':
                const eventResponse = await exports.getEventData();
                data = eventResponse;
                filename = `event-report-${Date.now()}`;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid report type. Supported types: academic, attendance, meal, event'
                });
        }

        switch (format) {
            case 'excel':
                return await exports.generateExcel(res, data, filename, type);
            case 'pdf':
                return await exports.generatePDF(res, data, filename, type);
            case 'csv':
                return await exports.generateCSV(res, data, filename, type);
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid format. Supported formats: excel, pdf, csv'
                });
        }
    } catch (error) {
        console.error('Export Report Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Helper functions for data retrieval
exports.getAcademicPerformanceData = async () => {
    const enrollments = await Enrollment.findAll({
        attributes: ['id', 'letterGrade', 'midtermGrade', 'finalGrade'],
        include: [{
            model: User,
            as: 'student',
            attributes: ['firstName', 'lastName', 'email']
        }, {
            model: CourseSection,
            as: 'section',
            include: [{
                model: Course,
                as: 'course',
                attributes: ['code', 'name']
            }]
        }],
        where: {
            letterGrade: { [Op.ne]: null }
        }
    });

    return enrollments.map(e => ({
        studentName: e.student ? `${e.student.firstName} ${e.student.lastName}` : 'N/A',
        studentEmail: e.student?.email || 'N/A',
        courseCode: e.section?.course?.code || 'N/A',
        courseName: e.section?.course?.name || 'N/A',
        midtermGrade: e.midtermGrade || 'N/A',
        finalGrade: e.finalGrade || 'N/A',
        letterGrade: e.letterGrade || 'N/A'
    }));
};

exports.getAttendanceData = async () => {
    const records = await AttendanceRecord.findAll({
        include: [{
            model: AttendanceSession,
            as: 'session',
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['code', 'name']
                }]
            }]
        }, {
            model: User,
            as: 'student',
            attributes: ['firstName', 'lastName', 'email']
        }],
        limit: 1000
    });

    return records.map(r => ({
        studentName: r.student ? `${r.student.firstName} ${r.student.lastName}` : 'N/A',
        studentEmail: r.student?.email || 'N/A',
        courseCode: r.session?.section?.course?.code || 'N/A',
        courseName: r.session?.section?.course?.name || 'N/A',
        sessionDate: r.session?.createdAt || 'N/A',
        status: r.status || 'N/A'
    }));
};

exports.getMealData = async () => {
    const reservations = await MealReservation.findAll({
        include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
        }],
        limit: 1000
    });

    return reservations.map(r => ({
        userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'N/A',
        userEmail: r.user?.email || 'N/A',
        date: r.date,
        mealType: r.mealType,
        status: r.status
    }));
};

exports.getEventData = async () => {
    const registrations = await EventRegistration.findAll({
        include: [{
            model: Event,
            as: 'event',
            attributes: ['title', 'category', 'date', 'location']
        }, {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
        }],
        limit: 1000
    });

    return registrations.map(r => ({
        userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'N/A',
        userEmail: r.user?.email || 'N/A',
        eventTitle: r.event?.title || 'N/A',
        eventCategory: r.event?.category || 'N/A',
        eventDate: r.event?.date || 'N/A',
        eventLocation: r.event?.location || 'N/A',
        registrationStatus: r.status
    }));
};

// Generate Excel file
exports.generateExcel = async (res, data, filename, type) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${type} Report`);

    if (data.length > 0) {
        // Add headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Add data rows
        data.forEach(row => {
            worksheet.addRow(Object.values(row));
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = 20;
        });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
};

// Generate PDF file
exports.generatePDF = async (res, data, filename, type) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('tr-TR')}`, { align: 'center' });
    doc.moveDown(2);

    if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const columnWidth = 750 / headers.length;

        // Headers
        doc.fontSize(8).font('Helvetica-Bold');
        let x = 30;
        headers.forEach(header => {
            doc.text(header, x, doc.y, { width: columnWidth, align: 'left' });
            x += columnWidth;
        });
        doc.moveDown();

        // Data rows
        doc.font('Helvetica').fontSize(7);
        data.slice(0, 50).forEach(row => { // Limit to 50 rows for PDF
            x = 30;
            const y = doc.y;
            Object.values(row).forEach(value => {
                doc.text(String(value || 'N/A').substring(0, 25), x, y, { width: columnWidth, align: 'left' });
                x += columnWidth;
            });
            doc.moveDown(0.5);

            // Add new page if needed
            if (doc.y > 520) {
                doc.addPage();
            }
        });
    }

    doc.end();
};

// Generate CSV file
exports.generateCSV = async (res, data, filename, type) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);

    // Add BOM for UTF-8
    res.write('\ufeff');

    if (data.length > 0) {
        // Headers
        const headers = Object.keys(data[0]);
        res.write(headers.join(',') + '\n');

        // Data rows
        data.forEach(row => {
            const values = Object.values(row).map(v => {
                const str = String(v || '');
                // Escape quotes and wrap in quotes if contains comma or quote
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            res.write(values.join(',') + '\n');
        });
    }

    res.end();
};
