module.exports = (sequelize, DataTypes) => {
  const ClassroomReservation = sequelize.define('ClassroomReservation', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    classroomId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'classrooms',
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
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    rejectedReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'classroom_reservations',
    timestamps: true
  });

  ClassroomReservation.associate = (models) => {
    ClassroomReservation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    ClassroomReservation.belongsTo(models.Classroom, {
      foreignKey: 'classroomId',
      as: 'classroom'
    });
  };

  return ClassroomReservation;
};

