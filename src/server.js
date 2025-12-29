require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { swaggerUi, specs } = require('./config/swagger');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initRedis, closeRedis } = require('./config/redis');
const socketService = require('./config/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
if (process.env.NODE_ENV !== 'test') {
  socketService.initialize(server);
  app.set('socketService', socketService);
}

// Middleware
// CORS configuration - explicitly allow frontend origins
origin: function (origin, callback) {
  const allowedOrigins = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://web-programlama-final-proje-frontend-production.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean); // Remove falsy values

  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);

  // Check if origin is allowed
  if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.railway.app')) {
    return callback(null, true);
  } else {
    console.log('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  }
},
credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Content-Disposition']
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting for all API routes
app.use('/api/', apiLimiter);



// Stripe webhook needs raw body, so handle it before JSON parser
app.use('/api/v1/wallet/topup/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for profile pictures
app.use('/uploads', express.static('uploads'));

// --- EMERGENCY CLEANUP ROUTE (TEMPORARY) ---
app.get('/api/admin/forced-cleanup-enrollments', async (req, res) => {
  try {
    const { Student, Enrollment, CourseSection, Course, Department } = require('./models');

    // 1. Get all students with their departments
    const students = await Student.findAll({
      include: [{ model: Department, as: 'department' }]
    });

    let removedCount = 0;
    let resetCount = 0;

    for (const student of students) {
      if (!student.departmentId) continue;

      const enrollments = await Enrollment.findAll({
        where: { studentId: student.userId },
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{ model: Course, as: 'course' }]
        }]
      });

      for (const enrollment of enrollments) {
        if (!enrollment.section || !enrollment.section.course) {
          await enrollment.destroy();
          removedCount++;
          continue;
        }

        const courseDepartmentId = enrollment.section.course.departmentId;

        // Check Department Mismatch
        if (courseDepartmentId !== student.departmentId) {
          await enrollment.destroy();
          removedCount++;
        } else {
          // Valid Department - Reset Grades
          if (enrollment.midtermGrade !== null || enrollment.finalGrade !== null) {
            await enrollment.update({
              midtermGrade: null,
              finalGrade: null,
              letterGrade: null,
              gradePoint: null
            });
            resetCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      stats: {
        removedInvalidEnrollments: removedCount,
        resetGrades: resetCount
      }
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ---------------------------------------------

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Akıllı Kampüs API Docs'
}));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  const connectedUsers = socketService.getConnectedUsersCount ? socketService.getConnectedUsersCount() : 0;
  res.json({
    status: 'OK',
    message: 'Web Programlama Final Projesi API is running',
    websocket: {
      enabled: process.env.NODE_ENV !== 'test',
      connectedUsers
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Database connection and server start - Main server initialization
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
    console.log('✅ Database connection established successfully.');

    // Initialize Redis (optional)
    await initRedis();

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const { execSync } = require('child_process');
        console.log('🔄 Running database migrations...');
        execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
        console.log('✅ Database migrations completed.');

        // Run seeds after migrations (only if RUN_SEEDS is set to true)
        if (process.env.RUN_SEEDS === 'true') {
          try {
            console.log('🌱 Running database seeds...');
            execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
            console.log('✅ Database seeds completed.');
          } catch (seedError) {
            console.error('⚠️ Seed error (continuing anyway):', seedError.message);
            // Continue even if seed fails (might already be seeded)
          }
        }
      } catch (migrationError) {
        console.error('⚠️ Migration error (continuing anyway):', migrationError.message);
        // Continue even if migration fails (might already be up to date)
      }
    }

    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    }

    // --- EMERGENCY FACULTY ASSIGNMENT ROUTE (TEMPORARY) ---
    app.get('/api/admin/assign-ce-faculty', async (req, res) => {
      try {
        const { User, Faculty, Course, CourseSection, Department } = require('./models');
        const { Op } = require('sequelize');

        // 1. Find Computer Engineering Department
        const department = await Department.findOne({
          where: {
            [Op.or]: [
              { name: 'Computer Engineering' },
              { name: 'Bilgisayar Mühendisliği' },
              { code: 'CENG' },
              { code: 'BM' }
            ]
          }
        });

        if (!department) {
          return res.status(404).json({ success: false, message: 'Computer Engineering department not found' });
        }

        // 1.5 Clean ALL assignments for Ali Veli (or any seeded faculty that might be messy)
        // Find Ali Veli by likely email or name
        const aliVeli = await User.findOne({
          where: {
            [Op.or]: [
              { email: 'ali.veli@kampus.edu.tr' },
              { email: 'ali@kampus.edu.tr' },
              { firstName: 'Ali', lastName: 'Veli' }
            ]
          }
        });

        if (aliVeli) {
          console.log(`🧹 Wiping all course assignments for Ali Veli (${aliVeli.id})`);
          await CourseSection.update(
            { instructorId: null },
            { where: { instructorId: aliVeli.id } }
          );
        }

        // 2. Find Courses
        const courses = await Course.findAll({
          where: { departmentId: department.id },
          limit: 5
        });

        const results = [];

        // 3. Create Faculties and Assign
        for (let i = 0; i < courses.length; i++) {
          const course = courses[i];
          const facultyNum = i + 1;
          const facultyEmail = `faculty${facultyNum}@kampus.edu.tr`;
          const password = 'Password123';

          // Create/Get User
          let [user, created] = await User.findOrCreate({
            where: { email: facultyEmail },
            defaults: {
              password: password,
              firstName: 'Dr. Faculty',
              lastName: `${facultyNum}`,
              role: 'faculty',
              isEmailVerified: true,
              isActive: true
            }
          });

          if (!created) {
            // Update password and Ensure role is faculty
            user.password = password;
            if (user.role !== 'faculty') user.role = 'faculty';
            await user.save();
          }

          // --- FIX: HANDLE NOT-NULL CONSTRAINT ---
          // Since we cannot set instructorId to null, we move old courses to a 'Placeholder' faculty
          // Create/Get Placeholder
          const [placeholder, _] = await User.findOrCreate({
            where: { email: 'unassigned@kampus.edu.tr' },
            defaults: {
              password: 'Password123',
              firstName: 'Unassigned',
              lastName: 'Course',
              role: 'faculty',
              isEmailVerified: true,
              isActive: true
            }
          });

          // Ensure placeholder has a profile
          const placeholderProfile = await Faculty.findOne({ where: { userId: placeholder.id } });
          if (!placeholderProfile) {
            await Faculty.create({
              userId: placeholder.id,
              departmentId: department.id, // Temporarily assign to same dept
              employeeNumber: `TBD-${Date.now()}`,
              title: 'lecturer'
            });
          }

          // Move ALL existing sections of this user to the placeholder
          await CourseSection.update(
            { instructorId: placeholder.id },
            { where: { instructorId: user.id } }
          );
          // ---------------------------------------------------------------

          // Ensure Faculty Profile Exists
          let facultyProfile = await Faculty.findOne({ where: { userId: user.id } });
          if (!facultyProfile) {
            await Faculty.create({
              userId: user.id,
              departmentId: department.id,
              employeeNumber: `FAC-${user.id.substring(0, 8)}`,
              title: 'assistant_professor'
            });
          }

          // 4. Assign to THIS Course Section
          const [updatedCount] = await CourseSection.update(
            { instructorId: user.id },
            { where: { courseId: course.id } }
          );

          results.push({
            course: course.name,
            instructor: facultyEmail,
            clearedPreviousAssignments: true,
            updatedSections: updatedCount
          });
        }

        res.json({
          success: true,
          department: department.name,
          assignments: results
        });

      } catch (error) {
        console.error('Faculty assignment failed:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    // ---------------------------------------------
    // Only start server if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      server.listen(PORT, () => {
        logger.info(`🚀 Server is running on port ${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        console.log(`🔌 WebSocket: ws://localhost:${PORT}`);

        // Start background jobs
        if (process.env.ENABLE_BACKGROUND_JOBS !== 'false') {
          const absenceWarningJob = require('./jobs/absenceWarningJob');
          absenceWarningJob.start();

          // Start Part 4 jobs
          try {
            const eventReminderJob = require('./jobs/eventReminderJob');
            eventReminderJob.start();
          } catch (e) {
            console.log('Event reminder job not available:', e.message);
          }

          try {
            const mealReminderJob = require('./jobs/mealReminderJob');
            mealReminderJob.start();
          } catch (e) {
            console.log('Meal reminder job not available:', e.message);
          }

          try {
            const sensorSimulator = require('./jobs/sensorSimulator');
            sensorSimulator.start();
          } catch (e) {
            console.log('Sensor simulator not available:', e.message);
          }
        }
      });
    }
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    console.error('❌ Unable to start server:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closeRedis();
  server.close(() => {
    logger.info('HTTP server closed');
  });
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await closeRedis();
  server.close(() => {
    logger.info('HTTP server closed');
  });
  process.exit(0);
});

// Only start server if this file is run directly (not in tests)
if (require.main === module) {
  startServer();
}

module.exports = app;
