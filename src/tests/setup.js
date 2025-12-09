require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Set test database configuration
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'web_programlama_final_proje_test';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Increase timeout for database operations
jest.setTimeout(30000);

// Setup database before all tests
beforeAll(async () => {
  const { sequelize } = require('../models');
  try {
    // Authenticate first
    await sequelize.authenticate();
    console.log('✅ Test database connected');
    
    // Try to sync with alter: false - this creates tables if they don't exist
    // but won't modify existing tables (avoiding "Too many keys" error)
    try {
      await sequelize.sync({ force: false, alter: false });
      console.log('✅ Database schema ready');
    } catch (syncError) {
      // If sync fails with "Too many keys", tables probably already exist
      // This is fine - continue with tests
      if (syncError.message && syncError.message.includes('Too many keys')) {
        console.log('ℹ️  Tables already exist, skipping sync');
      } else {
        // Other errors might be serious, but continue anyway
        console.warn('⚠️  Sync warning:', syncError.message);
      }
    }
  } catch (error) {
    console.error('❌ Test database connection failed:', error.message);
    console.error('💡 To fix this:');
    console.error('   1. Start Docker Desktop');
    console.error('   2. Run: docker-compose up -d postgres');
    console.error('   3. Run: npm run test:setup');
    console.error('   4. Or install PostgreSQL locally and create test database');
    // Continue anyway - some tests might still work without database
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection if needed
  const { sequelize } = require('../models');
  if (sequelize) {
    await sequelize.close();
  }
});

