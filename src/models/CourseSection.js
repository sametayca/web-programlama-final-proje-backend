module.exports = (sequelize, DataTypes) => {
  const CourseSection = sequelize.define('CourseSection', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    courseId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    sectionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    semester: {
      type: DataTypes.ENUM('fall', 'spring', 'summer'),
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    instructorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    classroomId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'classrooms',
        key: 'id'
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    enrolledCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    scheduleJson: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'course_sections',
    timestamps: true
  });

  CourseSection.associate = (models) => {
    CourseSection.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });
    CourseSection.belongsTo(models.User, {
      foreignKey: 'instructorId',
      as: 'instructor'
    });
    CourseSection.belongsTo(models.Classroom, {
      foreignKey: 'classroomId',
      as: 'classroom'
    });
    CourseSection.hasMany(models.Enrollment, {
      foreignKey: 'sectionId',
      as: 'enrollments'
    });
    CourseSection.hasMany(models.AttendanceSession, {
      foreignKey: 'sectionId',
      as: 'attendanceSessions'
    });
  };

  return CourseSection;
};

