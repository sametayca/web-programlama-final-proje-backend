module.exports = (sequelize, DataTypes) => {
  const MealMenu = sequelize.define('MealMenu', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cafeteriaId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'cafeterias',
        key: 'id'
      }
    },
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'),
      allowNull: false
    },
    menuDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    mainCourse: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    sideDish: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    soup: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    salad: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    dessert: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    availableQuota: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0
      }
    },
    reservedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'meal_menus',
    timestamps: true
  });

  MealMenu.associate = (models) => {
    MealMenu.belongsTo(models.Cafeteria, {
      foreignKey: 'cafeteriaId',
      as: 'cafeteria'
    });
    MealMenu.hasMany(models.MealReservation, {
      foreignKey: 'menuId',
      as: 'reservations'
    });
  };

  return MealMenu;
};

