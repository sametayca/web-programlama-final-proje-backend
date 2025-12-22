module.exports = (sequelize, DataTypes) => {
  const EventRegistration = sequelize.define('EventRegistration', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    qrCode: {
      type: DataTypes.STRING(36),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'approved'
    },
    checkedIn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    checkedInAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registeredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'event_registrations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['eventId', 'userId'],
        name: 'unique_event_user_registration'
      }
    ]
  });

  EventRegistration.associate = (models) => {
    EventRegistration.belongsTo(models.Event, {
      foreignKey: 'eventId',
      as: 'event'
    });
    EventRegistration.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return EventRegistration;
};

