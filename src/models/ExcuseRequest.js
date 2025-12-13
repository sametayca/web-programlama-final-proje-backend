module.exports = (sequelize, DataTypes) => {
  const ExcuseRequest = sequelize.define('ExcuseRequest', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'attendance_sessions',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    documentUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    reviewedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'excuse_requests',
    timestamps: true
  });

  ExcuseRequest.associate = (models) => {
    ExcuseRequest.belongsTo(models.User, {
      foreignKey: 'studentId',
      as: 'student'
    });
    ExcuseRequest.belongsTo(models.AttendanceSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
    ExcuseRequest.belongsTo(models.User, {
      foreignKey: 'reviewedBy',
      as: 'reviewer'
    });
  };

  return ExcuseRequest;
};

