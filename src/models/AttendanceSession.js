module.exports = (sequelize, DataTypes) => {
  const AttendanceSession = sequelize.define('AttendanceSession', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sectionId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'course_sections',
        key: 'id'
      }
    },
    instructorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    geofenceRadius: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 15.00
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    qrCodeExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'closed'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'attendance_sessions',
    timestamps: true
  });

  AttendanceSession.associate = (models) => {
    AttendanceSession.belongsTo(models.CourseSection, {
      foreignKey: 'sectionId',
      as: 'section'
    });
    AttendanceSession.belongsTo(models.User, {
      foreignKey: 'instructorId',
      as: 'instructor'
    });
    AttendanceSession.hasMany(models.AttendanceRecord, {
      foreignKey: 'sessionId',
      as: 'records'
    });
    AttendanceSession.hasMany(models.ExcuseRequest, {
      foreignKey: 'sessionId',
      as: 'excuseRequests'
    });
  };

  return AttendanceSession;
};

