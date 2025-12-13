module.exports = (sequelize, DataTypes) => {
  const AttendanceRecord = sequelize.define('AttendanceRecord', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'attendance_sessions',
        key: 'id'
      }
    },
    studentId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    accuracy: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    distanceFromCenter: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false
    },
    isFlagged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    flagReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'attendance_records',
    timestamps: true
  });

  AttendanceRecord.associate = (models) => {
    AttendanceRecord.belongsTo(models.AttendanceSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
    AttendanceRecord.belongsTo(models.User, {
      foreignKey: 'studentId',
      as: 'student'
    });
  };

  return AttendanceRecord;
};

