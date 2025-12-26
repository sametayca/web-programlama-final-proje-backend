const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const { User, Student, Faculty, Department } = require('../models');
const emailService = require('./emailService');

class AuthService {
  // Generate JWT Tokenn
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
  }

  // Generate Refresh Tokenn
  generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
  }

  // Generate unique student numberr
  async generateStudentNumber(departmentCode, enrollmentYear) {
    let studentNumber;
    let exists = true;
    let counter = 1;

    while (exists) {
      const year = enrollmentYear.toString().slice(-2);
      studentNumber = `${departmentCode}${year}${counter.toString().padStart(4, '0')}`;

      const existing = await Student.findOne({ where: { studentNumber } });
      if (!existing) {
        exists = false;
      } else {
        counter++;
      }
    }

    return studentNumber;
  }

  // Generate unique employee numberr
  async generateEmployeeNumber(departmentCode) {
    let employeeNumber;
    let exists = true;
    let counter = 1;

    while (exists) {
      employeeNumber = `${departmentCode}${counter.toString().padStart(5, '0')}`;

      const existing = await Faculty.findOne({ where: { employeeNumber } });
      if (!existing) {
        exists = false;
      } else {
        counter++;
      }
    }

    return employeeNumber;
  }

  // Register new userr
  async register(userData) {
    const { email, password, firstName, lastName, phone, role, studentNumber, employeeNumber, departmentId, enrollmentYear, title } = userData;

    // Check if user existss
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Bu e-posta adresi ile zaten bir hesap mevcut');
    }

    // Validate department exists and get department infoo
    let department = null;
    if (departmentId) {
      department = await Department.findByPk(departmentId);
      if (!department) {
        throw new Error('Seçilen bölüm bulunamadı');
      }
      if (!department.isActive) {
        throw new Error('Seçilen bölüm aktif değil');
      }
    }

    // Generate email verification tokenn
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create userr
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      emailVerificationToken,
      emailVerificationExpires
    });

    // Create role-specific profile with auto-generated numbers
    try {
      if (role === 'student' && departmentId) {
        const finalEnrollmentYear = enrollmentYear || new Date().getFullYear();
        const autoStudentNumber = studentNumber || await this.generateStudentNumber(department.code, finalEnrollmentYear);

        await Student.create({
          userId: user.id,
          studentNumber: autoStudentNumber,
          departmentId,
          enrollmentYear: finalEnrollmentYear
        });
      } else if (role === 'faculty' && departmentId) {
        const autoEmployeeNumber = employeeNumber || await this.generateEmployeeNumber(department.code);

        await Faculty.create({
          userId: user.id,
          employeeNumber: autoEmployeeNumber,
          departmentId,
          title: title || 'lecturer'
        });
      }
    } catch (error) {
      // If profile creation fails, delete the user
      await user.destroy();
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (role === 'student') {
          throw new Error(`Bu öğrenci numarası zaten kullanılıyor`);
        } else if (role === 'faculty') {
          throw new Error(`Bu personel numarası zaten kullanılıyor`);
        }
      }
      throw new Error('Profil oluşturulurken bir hata oluştu: ' + error.message);
    }

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, emailVerificationToken);
    } catch (error) {
      console.error('Email sending failed:', error);
      // Don't throw error, user is created anyway
    }

    return user;
  }

  // Verify email
  async verifyEmail(token) {
    // Trim token to handle whitespace issues
    const trimmedToken = token ? token.trim() : null;

    if (!trimmedToken) {
      throw new Error('Doğrulama token\'ı gerekli');
    }

    console.log('🔍 Verifying token:', trimmedToken.substring(0, 20) + '...');
    console.log('🔍 Token length:', trimmedToken.length);

    const user = await User.findOne({
      where: {
        emailVerificationToken: trimmedToken
      }
    });

    if (!user) {


      throw new Error('Geçersiz doğrulama token\'ı');
    }

    // Check if token is expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      throw new Error('Doğrulama token\'ının süresi dolmuş. Lütfen yeni bir doğrulama e-postası isteyin.');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new Error('Bu e-posta adresi zaten doğrulanmış');
    }

    console.log('✅ Token verified for user:', user.email);

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Auto-enroll student in their department's courses after email verification
    if (user.role === 'student') {
      try {
        const studentProfile = await Student.findOne({
          where: { userId: user.id },
          include: [{
            model: Department,
            as: 'department'
          }]
        });

        if (studentProfile && studentProfile.departmentId) {
          console.log(`🎓 Auto-enrolling student ${user.email} in department courses...`);
          const enrollmentService = require('./enrollmentService');
          const enrollments = await enrollmentService.autoEnrollByDepartment(
            user.id,
            studentProfile.departmentId
          );
          console.log(`✅ Auto-enrolled in ${enrollments.length} courses`);
        }
      } catch (error) {
        console.error('⚠️ Auto-enrollment failed (non-critical):', error.message);
        // Don't throw error, email verification should still succeed
      }
    }

    return user;
  }

  // Login
  async login(email, password) {
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Student, as: 'studentProfile', include: [{ model: Department, as: 'department' }] },
        { model: Faculty, as: 'facultyProfile', include: [{ model: Department, as: 'department' }] }
      ]
    });

    if (!user) {
      console.log('❌ User not found:', email);
      throw new Error('Geçersiz e-posta veya şifre');
    }

    if (!user.isActive) {
      console.log('❌ User is not active:', email);
      throw new Error('Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      throw new Error('Geçersiz e-posta veya şifre');
    }

    console.log('✅ Login successful for user:', email, 'Role:', user.role);

    // Auto-enroll student in department courses if email verified but no enrollments yet
    if (user.role === 'student' && user.isEmailVerified && user.studentProfile?.departmentId) {
      // Check if student has any enrollments (async, non-blocking)
      const { Enrollment } = require('../models');
      Enrollment.count({
        where: { studentId: user.id, status: 'enrolled' }
      }).then(async (count) => {
        if (count === 0) {
          try {
            console.log(`🎓 Auto-enrolling existing student ${user.email} in department courses...`);
            const enrollmentService = require('./enrollmentService');
            const enrollments = await enrollmentService.autoEnrollByDepartment(
              user.id,
              user.studentProfile.departmentId
            );
            console.log(`✅ Auto-enrolled in ${enrollments.length} courses`);
          } catch (error) {
            console.error('⚠️ Auto-enrollment failed (non-critical):', error.message);
          }
        }
      }).catch(err => {
        console.error('⚠️ Error checking enrollments:', err.message);
      });
    }

    // Generate tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user,
      token,
      refreshToken
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user || user.refreshToken !== refreshToken || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      const newToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout
  async logout(userId) {
    const user = await User.findByPk(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return { message: 'Logged out successfully' };
  }

  // Forgot password
  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If email exists, password reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      console.error('Email sending failed:', error);
    }

    return { message: 'If email exists, password reset link has been sent' };
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Sequelize.Op.gt]: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  // Get user profile
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Student, as: 'studentProfile', include: [{ model: Department, as: 'department' }] },
        { model: Faculty, as: 'facultyProfile', include: [{ model: Department, as: 'department' }] }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update profile
  async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const allowedFields = ['firstName', 'lastName', 'phone'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    await user.save();
    return user;
  }

  // Update profile picture
  async updateProfilePicture(userId, filename) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete old picture if exists
    if (user.profilePicture) {
      const fs = require('fs');
      const oldPath = `uploads/profile-pictures/${user.profilePicture}`;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = filename;
    await user.save();

    return user;
  }
}

module.exports = new AuthService();

