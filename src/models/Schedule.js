module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define('Schedule', {
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
    classroomId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'classrooms',
        key: 'id'
      }
    },
    day: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
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
    semester: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'schedules',
    timestamps: true
  });

  Schedule.associate = (models) => {
    Schedule.belongsTo(models.CourseSection, {
      foreignKey: 'sectionId',
      as: 'section'
    });
    Schedule.belongsTo(models.Classroom, {
      foreignKey: 'classroomId',
      as: 'classroom'
    });
  };

  return Schedule;
};

