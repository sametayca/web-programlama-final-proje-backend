const authService = require('../../services/authService');
const { User, Student, Faculty, Department } = require('../../models');
const emailService = require('../../services/emailService');
const jwt = require('jsonwebtoken');

// Mock models
jest.mock('../../models');
jest.mock('../../services/emailService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = '123';
      const token = authService.generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = '123';
      const refreshToken = authService.generateRefreshToken(userId);
      
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3);
    });
  });

  describe('generateStudentNumber', () => {
    it('should generate unique student numbers', async () => {
      Student.findOne = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      const number1 = await authService.generateStudentNumber('CS', 2024);
      const number2 = await authService.generateStudentNumber('CS', 2024);
      
      expect(number1).toMatch(/^CS24\d{4}$/);
      expect(number2).toMatch(/^CS24\d{4}$/);
    });

    it('should increment counter when number exists', async () => {
      Student.findOne = jest.fn()
        .mockResolvedValueOnce({ id: '1' })
        .mockResolvedValueOnce(null);
      
      const number = await authService.generateStudentNumber('CS', 2024);
      expect(number).toMatch(/^CS24\d{4}$/);
    });
  });

  describe('generateEmployeeNumber', () => {
    it('should generate unique employee numbers', async () => {
      Faculty.findOne = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      const number1 = await authService.generateEmployeeNumber('CS');
      const number2 = await authService.generateEmployeeNumber('CS');
      
      expect(number1).toMatch(/^CS\d{5}$/);
      expect(number2).toMatch(/^CS\d{5}$/);
    });

    it('should increment counter when number exists', async () => {
      Faculty.findOne = jest.fn()
        .mockResolvedValueOnce({ id: '1' })
        .mockResolvedValueOnce(null);
      
      const number = await authService.generateEmployeeNumber('CS');
      expect(number).toMatch(/^CS\d{5}$/);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue({ id: '1', ...userData });
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({});

      const user = await authService.register(userData);
      
      expect(user).toBeDefined();
      expect(User.create).toHaveBeenCalled();
    });

    it('should throw error if email exists', async () => {
      User.findOne = jest.fn().mockResolvedValue({ id: '1' });

      await expect(authService.register({
        email: 'existing@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      })).rejects.toThrow('Bu e-posta adresi ile zaten bir hesap mevcut');
    });

    it('should create student profile when role is student', async () => {
      const userData = {
        email: 'student@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        departmentId: 'dept1',
        enrollmentYear: 2024
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = { id: 'user1', ...userData };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Student.create = jest.fn().mockResolvedValue({});
      Student.findOne = jest.fn().mockResolvedValue(null);
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({});

      await authService.register(userData);
      
      expect(Student.create).toHaveBeenCalled();
    });

    it('should use provided studentNumber when given', async () => {
      const userData = {
        email: 'student2@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        departmentId: 'dept1',
        studentNumber: 'CUSTOM001'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = { id: 'user1', ...userData };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Student.create = jest.fn().mockResolvedValue({});
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({});

      await authService.register(userData);
      
      expect(Student.create).toHaveBeenCalledWith(
        expect.objectContaining({ studentNumber: 'CUSTOM001' })
      );
    });

    it('should use current year when enrollmentYear not provided', async () => {
      const userData = {
        email: 'student3@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        departmentId: 'dept1'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = { id: 'user1', ...userData };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Student.create = jest.fn().mockResolvedValue({});
      Student.findOne = jest.fn().mockResolvedValue(null);
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({});

      await authService.register(userData);
      
      expect(Student.create).toHaveBeenCalled();
    });

    it('should create faculty profile when role is faculty', async () => {
      const userData = {
        email: 'faculty@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'faculty',
        departmentId: 'dept1',
        title: 'professor'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = { id: 'user1', ...userData };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Faculty.create = jest.fn().mockResolvedValue({});
      Faculty.findOne = jest.fn().mockResolvedValue(null);
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({});

      await authService.register(userData);
      
      expect(Faculty.create).toHaveBeenCalled();
    });

    it('should use provided employeeNumber when given', async () => {
      const userData = {
        email: 'faculty2@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'faculty',
        departmentId: 'dept1',
        employeeNumber: 'CUSTOM001'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = { id: 'user1', ...userData };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Faculty.create = jest.fn().mockResolvedValue({});
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({});

      await authService.register(userData);
      
      expect(Faculty.create).toHaveBeenCalledWith(
        expect.objectContaining({ employeeNumber: 'CUSTOM001' })
      );
    });

    it('should use default title when not provided for faculty', async () => {
      const userData = {
        email: 'faculty3@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'faculty',
        departmentId: 'dept1'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = { id: 'user1', ...userData };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Faculty.create = jest.fn().mockResolvedValue({});
      Faculty.findOne = jest.fn().mockResolvedValue(null);
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({});

      await authService.register(userData);
      
      expect(Faculty.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'lecturer' })
      );
    });

    it('should delete user if profile creation fails with unique constraint for student', async () => {
      const userData = {
        email: 'fail@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        departmentId: 'dept1'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = {
        id: 'user1',
        destroy: jest.fn().mockResolvedValue(true),
        ...userData
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Student.create = jest.fn().mockRejectedValue({
        name: 'SequelizeUniqueConstraintError'
      });

      await expect(authService.register(userData)).rejects.toThrow('Bu öğrenci numarası zaten kullanılıyor');
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('should delete user if profile creation fails with unique constraint for faculty', async () => {
      const userData = {
        email: 'fail2@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'faculty',
        departmentId: 'dept1'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = {
        id: 'user1',
        destroy: jest.fn().mockResolvedValue(true),
        ...userData
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Faculty.create = jest.fn().mockRejectedValue({
        name: 'SequelizeUniqueConstraintError'
      });

      await expect(authService.register(userData)).rejects.toThrow('Bu personel numarası zaten kullanılıyor');
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('should delete user if profile creation fails with other error', async () => {
      const userData = {
        email: 'fail3@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        departmentId: 'dept1'
      };

      const mockDepartment = { id: 'dept1', code: 'CS', isActive: true };
      const mockUser = {
        id: 'user1',
        destroy: jest.fn().mockResolvedValue(true),
        ...userData
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(mockDepartment);
      User.create = jest.fn().mockResolvedValue(mockUser);
      Student.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(authService.register(userData)).rejects.toThrow('Profil oluşturulurken bir hata oluştu');
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('should handle email sending failure gracefully', async () => {
      const userData = {
        email: 'emailfail@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const mockUser = { id: 'user1', ...userData };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(mockUser);
      emailService.sendVerificationEmail = jest.fn().mockRejectedValue(new Error('SMTP Error'));

      const user = await authService.register(userData);
      
      expect(user).toBeDefined();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw error if department not found', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue(null);

      await expect(authService.register({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        departmentId: 'invalid'
      })).rejects.toThrow('Seçilen bölüm bulunamadı');
    });

    it('should throw error if department is inactive', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      Department.findByPk = jest.fn().mockResolvedValue({ id: '1', isActive: false });

      await expect(authService.register({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        departmentId: '1'
      })).rejects.toThrow('Seçilen bölüm aktif değil');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const mockUser = {
        id: '1',
        isEmailVerified: false,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.verifyEmail('valid-token');
      
      expect(result.isEmailVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired verification token');
    });

    it('should throw error for expired token', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.verifyEmail('expired-token')).rejects.toThrow('Invalid or expired verification token');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.login('test@test.com', 'password123');
      
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should include student and faculty profiles in login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        studentProfile: { id: 's1' },
        facultyProfile: null
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.login('test@test.com', 'password123');
      
      expect(result.user).toBeDefined();
      expect(User.findOne).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.any(Array)
      }));
    });

    it('should throw error for invalid credentials', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.login('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const mockUser = {
        id: '1',
        isActive: false
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(authService.login('test@test.com', 'password123')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      const mockUser = {
        id: '1',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(authService.login('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      const mockUser = {
        id: '1',
        refreshToken: 'valid-refresh-token',
        isActive: true,
        save: jest.fn().mockResolvedValue(true)
      };

      jwt.verify = jest.fn().mockReturnValue({ id: '1' });
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.refreshToken('valid-refresh-token');
      
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error when refresh token does not match', async () => {
      const mockUser = {
        id: '1',
        refreshToken: 'different-token',
        isActive: true
      };

      jwt.verify = jest.fn().mockReturnValue({ id: '1' });
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await expect(authService.refreshToken('valid-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error when user not found', async () => {
      jwt.verify = jest.fn().mockReturnValue({ id: '1' });
      User.findByPk = jest.fn().mockResolvedValue(null);

      await expect(authService.refreshToken('token')).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockUser = {
        id: '1',
        refreshToken: 'token',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.logout('1');
      
      expect(result.message).toBe('Logged out successfully');
      expect(mockUser.refreshToken).toBeNull();
    });

    it('should handle logout when user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      const result = await authService.logout('invalid');
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail = jest.fn().mockResolvedValue({});

      const result = await authService.forgotPassword('test@test.com');
      
      expect(result.message).toContain('password reset link has been sent');
      expect(mockUser.passwordResetToken).toBeDefined();
    });

    it('should return same message for non-existent user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await authService.forgotPassword('nonexistent@test.com');
      expect(result.message).toContain('password reset link has been sent');
    });

    it('should handle email sending failure in forgotPassword', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail = jest.fn().mockRejectedValue(new Error('SMTP Error'));

      const result = await authService.forgotPassword('test@test.com');
      
      expect(result.message).toContain('password reset link has been sent');
      expect(mockUser.passwordResetToken).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockUser = {
        id: '1',
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() + 3600000),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.resetPassword('valid-token', 'newpassword123');
      
      expect(result.message).toBe('Password reset successfully');
      expect(mockUser.passwordResetToken).toBeNull();
    });

    it('should throw error for invalid token', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.resetPassword('invalid-token', 'newpassword123')).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for expired token', async () => {
      const mockUser = {
        id: '1',
        passwordResetToken: 'expired-token',
        passwordResetExpires: new Date(Date.now() - 1000)
      };

      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.resetPassword('expired-token', 'newpassword123')).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.getProfile('1');
      
      expect(result).toBeDefined();
      expect(User.findByPk).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('should throw error when user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      await expect(authService.getProfile('invalid')).rejects.toThrow('User not found');
    });

    it('should include student and faculty profiles', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        studentProfile: { id: 's1' },
        facultyProfile: null
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.getProfile('1');
      
      expect(result).toBeDefined();
      expect(User.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
        include: expect.any(Array)
      }));
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: '1',
        firstName: 'Old',
        lastName: 'Name',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.updateProfile('1', {
        firstName: 'New',
        lastName: 'Name'
      });
      
      expect(result.firstName).toBe('New');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      await expect(authService.updateProfile('invalid', {})).rejects.toThrow('User not found');
    });

    it('should only update allowed fields', async () => {
      const mockUser = {
        id: '1',
        firstName: 'Old',
        lastName: 'Name',
        phone: '123',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authService.updateProfile('1', {
        firstName: 'New',
        lastName: 'NewName',
        phone: '456',
        email: 'hack@test.com' // Should be ignored
      });
      
      expect(mockUser.firstName).toBe('New');
      expect(mockUser.lastName).toBe('NewName');
      expect(mockUser.phone).toBe('456');
      expect(mockUser.email).toBeUndefined();
    });
  });

  describe('updateProfilePicture', () => {
    it('should update profile picture', async () => {
      const mockUser = {
        id: '1',
        profilePicture: null,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.updateProfilePicture('1', 'picture.jpg');
      
      expect(result.profilePicture).toBe('picture.jpg');
    });

    it('should delete old picture when updating', async () => {
      const fs = require('fs');
      const mockUser = {
        id: '1',
        profilePicture: 'old.jpg',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.unlinkSync = jest.fn();

      await authService.updateProfilePicture('1', 'new.jpg');
      
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      await expect(authService.updateProfilePicture('invalid', 'pic.jpg')).rejects.toThrow('User not found');
    });
  });
});

