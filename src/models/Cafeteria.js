module.exports = (sequelize, DataTypes) => {
  const Cafeteria = sequelize.define('Cafeteria', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    openingTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    closingTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'cafeterias',
    timestamps: true
  });

  Cafeteria.associate = (models) => {
    Cafeteria.hasMany(models.MealMenu, {
      foreignKey: 'cafeteriaId',
      as: 'menus'
    });
  };

  return Cafeteria;
};

