const { Sequelize } = require('sequelize');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions || {}
  }
);

const db = {};

// Import models
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Student = require('./Student')(sequelize, Sequelize.DataTypes);
db.Faculty = require('./Faculty')(sequelize, Sequelize.DataTypes);
db.Department = require('./Department')(sequelize, Sequelize.DataTypes);

// Part 2 Models
db.Classroom = require('./Classroom')(sequelize, Sequelize.DataTypes);
db.Course = require('./Course')(sequelize, Sequelize.DataTypes);
db.CourseSection = require('./CourseSection')(sequelize, Sequelize.DataTypes);
db.CoursePrerequisite = require('./CoursePrerequisite')(sequelize, Sequelize.DataTypes);
db.Enrollment = require('./Enrollment')(sequelize, Sequelize.DataTypes);
db.AttendanceSession = require('./AttendanceSession')(sequelize, Sequelize.DataTypes);
db.AttendanceRecord = require('./AttendanceRecord')(sequelize, Sequelize.DataTypes);
db.ExcuseRequest = require('./ExcuseRequest')(sequelize, Sequelize.DataTypes);
db.Announcement = require('./Announcement')(sequelize, Sequelize.DataTypes);

// Part 3 Models - Meal Reservation System
db.Cafeteria = require('./Cafeteria')(sequelize, Sequelize.DataTypes);
db.MealMenu = require('./MealMenu')(sequelize, Sequelize.DataTypes);
db.MealReservation = require('./MealReservation')(sequelize, Sequelize.DataTypes);
db.Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);

// Part 3 Models - Event Management
db.Event = require('./Event')(sequelize, Sequelize.DataTypes);
db.EventRegistration = require('./EventRegistration')(sequelize, Sequelize.DataTypes);

// Part 3 Models - Course Scheduling
db.Schedule = require('./Schedule')(sequelize, Sequelize.DataTypes);

// Part 3 Models - Classroom Reservations
db.ClassroomReservation = require('./ClassroomReservation')(sequelize, Sequelize.DataTypes);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

