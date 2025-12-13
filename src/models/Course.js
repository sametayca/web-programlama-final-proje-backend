module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    ects: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    syllabusUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    departmentId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'courses',
    timestamps: true
  });

  Course.associate = (models) => {
    Course.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department'
    });
    Course.hasMany(models.CourseSection, {
      foreignKey: 'courseId',
      as: 'sections'
    });
    Course.belongsToMany(models.Course, {
      through: models.CoursePrerequisite,
      foreignKey: 'courseId',
      otherKey: 'prerequisiteCourseId',
      as: 'prerequisites'
    });
    Course.belongsToMany(models.Course, {
      through: models.CoursePrerequisite,
      foreignKey: 'prerequisiteCourseId',
      otherKey: 'courseId',
      as: 'requiredFor'
    });
  };

  return Course;
};

