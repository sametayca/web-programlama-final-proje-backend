module.exports = (sequelize, DataTypes) => {
  const Enrollment = sequelize.define('Enrollment', {
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
    sectionId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'course_sections',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('enrolled', 'completed', 'dropped', 'failed'),
      allowNull: false,
      defaultValue: 'enrolled'
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    midtermGrade: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    finalGrade: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    letterGrade: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F', 'I', 'W'),
      allowNull: true
    },
    gradePoint: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true
    }
  }, {
    tableName: 'enrollments',
    timestamps: true
  });

  Enrollment.associate = (models) => {
    Enrollment.belongsTo(models.User, {
      foreignKey: 'studentId',
      as: 'student'
    });
    Enrollment.belongsTo(models.CourseSection, {
      foreignKey: 'sectionId',
      as: 'section'
    });
  };

  return Enrollment;
};

