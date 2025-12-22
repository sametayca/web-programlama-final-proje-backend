require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { swaggerUi, specs } = require('./config/swagger');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initRedis, closeRedis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting for all API routes
app.use('/api/', apiLimiter);

// Middleware
// Allow both localhost and local IP for mobile device access
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3000',
  'http://192.168.60.97:3001',
  'http://192.168.1.142:3002',
  'http://172.18.16.1:3002'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true
}));

// Stripe webhook needs raw body, so handle it before JSON parser
app.use('/api/v1/wallet/topup/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for profile pictures
app.use('/uploads', express.static('uploads'));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Akıllı Kampüs API Docs'
}));

// Routes
app.use('/api', routes);

// Health checkk
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Web Programlama Final Projesi API is running' });
});

// Error handler (must be lastt)
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
    
    // Only start server if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        logger.info(`🚀 Server is running on port ${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        
        // Start background jobs
        if (process.env.ENABLE_BACKGROUND_JOBS !== 'false') {
          const absenceWarningJob = require('./jobs/absenceWarningJob');
          absenceWarningJob.start();
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
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await closeRedis();
  process.exit(0);
});

// Only start server if this file is run directly (not in tests)
if (require.main === module) {
  startServer();
}

module.exports = app;

