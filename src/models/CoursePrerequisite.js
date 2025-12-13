module.exports = (sequelize, DataTypes) => {
  const CoursePrerequisite = sequelize.define('CoursePrerequisite', {
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
    prerequisiteCourseId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    }
  }, {
    tableName: 'course_prerequisites',
    timestamps: true
  });

  CoursePrerequisite.associate = (models) => {
    CoursePrerequisite.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });
    CoursePrerequisite.belongsTo(models.Course, {
      foreignKey: 'prerequisiteCourseId',
      as: 'prerequisite'
    });
  };

  return CoursePrerequisite;
};

