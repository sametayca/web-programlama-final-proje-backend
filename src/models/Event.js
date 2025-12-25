module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    eventType: {
      type: DataTypes.ENUM('seminar', 'workshop', 'conference', 'social', 'sports', 'cultural', 'academic', 'exam', 'holiday', 'registration', 'ceremony', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterStart(value) {
          if (value && this.startDate && value < this.startDate) {
            throw new Error('End date must be after start date');
          }
        }
      }
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 1
      }
    },
    registeredCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    organizer: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    organizerId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'events',
    timestamps: true
  });

  Event.associate = (models) => {
    Event.belongsTo(models.User, {
      foreignKey: 'organizerId',
      as: 'organizerUser'
    });
    Event.hasMany(models.EventRegistration, {
      foreignKey: 'eventId',
      as: 'registrations'
    });
  };

  return Event;
};

