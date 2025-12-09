const { Sequelize } = require('sequelize');

// Connect to PostgreSQL server (not a specific database)
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: false
});

async function createTestDatabase() {
  const testDbName = process.env.DB_NAME || 'web_programlama_final_proje_test';
  
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${testDbName}'`
    );

    if (results.length > 0) {
      console.log(`ℹ️  Database '${testDbName}' already exists`);
    } else {
      // Create database
      await sequelize.query(`CREATE DATABASE ${testDbName}`);
      console.log(`✅ Created test database '${testDbName}'`);
    }

    await sequelize.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Docker Desktop is running');
    console.error('   2. PostgreSQL container is running: docker-compose up -d postgres');
    console.error('   3. Or PostgreSQL is installed and running locally');
    process.exit(1);
  }
}

createTestDatabase();

