module.exports = (sequelize, DataTypes) => {
  const MealReservation = sequelize.define('MealReservation', {
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
    menuId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'meal_menus',
        key: 'id'
      }
    },
    reservationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    qrCode: {
      type: DataTypes.STRING(36),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'used', 'cancelled', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    isScholarshipMeal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'meal_reservations',
    timestamps: true
  });

  MealReservation.associate = (models) => {
    MealReservation.belongsTo(models.User, {
      foreignKey: 'studentId',
      as: 'student'
    });
    MealReservation.belongsTo(models.MealMenu, {
      foreignKey: 'menuId',
      as: 'menu'
    });
  };

  return MealReservation;
};

