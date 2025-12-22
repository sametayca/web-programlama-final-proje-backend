module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
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
    type: {
      type: DataTypes.ENUM('deposit', 'withdrawal', 'meal_payment', 'refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    referenceId: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    updatedAt: false // Transactions should not be updated
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'studentId',
      as: 'student'
    });
    Transaction.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Transaction;
};

