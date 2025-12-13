module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'departments',
    timestamps: true
  });

  Department.associate = (models) => {
    Department.hasMany(models.Student, {
      foreignKey: 'departmentId',
      as: 'students'
    });
    Department.hasMany(models.Faculty, {
      foreignKey: 'departmentId',
      as: 'faculty'
    });
    Department.hasMany(models.Course, {
      foreignKey: 'departmentId',
      as: 'courses'
    });
  };

  return Department;
};

