const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('student', 'faculty', 'admin', 'staff'),
      allowNull: false,
      defaultValue: 'student'
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.associate = (models) => {
    User.hasOne(models.Student, {
      foreignKey: 'userId',
      as: 'studentProfile'
    });
    User.hasOne(models.Faculty, {
      foreignKey: 'userId',
      as: 'facultyProfile'
    });
    // Part 2 Associations
    User.hasMany(models.CourseSection, {
      foreignKey: 'instructorId',
      as: 'instructedSections'
    });
    User.hasMany(models.Enrollment, {
      foreignKey: 'studentId',
      as: 'enrollments'
    });
    User.hasMany(models.AttendanceSession, {
      foreignKey: 'instructorId',
      as: 'attendanceSessions'
    });
    User.hasMany(models.AttendanceRecord, {
      foreignKey: 'studentId',
      as: 'attendanceRecords'
    });
    User.hasMany(models.ExcuseRequest, {
      foreignKey: 'studentId',
      as: 'excuseRequests'
    });
    User.hasMany(models.ExcuseRequest, {
      foreignKey: 'reviewedBy',
      as: 'reviewedExcuseRequests'
    });
    User.hasMany(models.Announcement, {
      foreignKey: 'authorId',
      as: 'announcements'
    });
    // Part 3 Associations - Meal Reservations
    User.hasMany(models.MealReservation, {
      foreignKey: 'studentId',
      as: 'mealReservations'
    });
    User.hasMany(models.Transaction, {
      foreignKey: 'studentId',
      as: 'transactions'
    });
    // Part 3 Associations - Event Management
    User.hasMany(models.Event, {
      foreignKey: 'organizerId',
      as: 'organizedEvents'
    });
    User.hasMany(models.EventRegistration, {
      foreignKey: 'userId',
      as: 'eventRegistrations'
    });
  };

  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.refreshToken;
    delete values.emailVerificationToken;
    delete values.passwordResetToken;
    return values;
  };

  return User;
};

