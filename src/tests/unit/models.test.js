const { User, Student, Faculty, Department } = require('../../models');
const bcrypt = require('bcryptjs');

describe('Model Tests', () => {
  describe('User Model', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.isEmailVerified).toBe(false);
      expect(user.isActive).toBe(true);

      // Verify password is hashed
      const isMatch = await bcrypt.compare(userData.password, user.password);
      expect(isMatch).toBe(true);

      await user.destroy({ force: true });
    });

    it('should hash password on update', async () => {
      const user = await User.create({
        email: 'update@example.com',
        password: 'oldpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      });

      const oldPassword = user.password;
      user.password = 'newpassword';
      await user.save();

      expect(user.password).not.toBe(oldPassword);
      expect(user.password).not.toBe('newpassword'); // Should be hashed

      const isMatch = await bcrypt.compare('newpassword', user.password);
      expect(isMatch).toBe(true);

      await user.destroy({ force: true });
    });

    it('should validate email format', async () => {
      await expect(
        User.create({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
      ).rejects.toThrow();
    });

    it('should require email', async () => {
      await expect(
        User.create({
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
      ).rejects.toThrow();
    });

    it('should require password with minimum length', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          password: '12345', // Less than 6 characters
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
      ).rejects.toThrow();
    });

    it('should have unique email', async () => {
      const user1 = await User.create({
        email: 'unique@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      });

      await expect(
        User.create({
          email: 'unique@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        })
      ).rejects.toThrow();

      await user1.destroy({ force: true });
    });

    it('should have associations with Student and Faculty', () => {
      expect(User.associate).toBeDefined();
    });

    it('should compare password correctly', async () => {
      const user = await User.create({
        email: 'compare@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      });

      const isValid = await user.comparePassword('password123');
      expect(isValid).toBe(true);

      const isInvalid = await user.comparePassword('wrongpassword');
      expect(isInvalid).toBe(false);

      await user.destroy({ force: true });
    });

    it('should exclude sensitive fields from JSON', async () => {
      const user = await User.create({
        email: 'json@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        refreshToken: 'some-token',
        emailVerificationToken: 'verify-token',
        passwordResetToken: 'reset-token'
      });

      const json = user.toJSON();
      
      expect(json.password).toBeUndefined();
      expect(json.refreshToken).toBeUndefined();
      expect(json.emailVerificationToken).toBeUndefined();
      expect(json.passwordResetToken).toBeUndefined();
      expect(json.email).toBe('json@example.com');
      expect(json.firstName).toBe('Test');

      await user.destroy({ force: true });
    });
  });

  describe('Department Model', () => {
    it('should require name', async () => {
      await expect(
        Department.create({
          code: 'TEST',
          isActive: true
        })
      ).rejects.toThrow();
    });

    it('should require code', async () => {
      await expect(
        Department.create({
          name: 'Test Department',
          isActive: true
        })
      ).rejects.toThrow();
    });
  });

  describe('Student Model', () => {
    let department;
    let user;

    beforeEach(async () => {
      department = await Department.create({
        name: 'Test Department',
        code: 'TEST',
        isActive: true
      });

      user = await User.create({
        email: 'student@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student'
      });
    });

    afterEach(async () => {
      await Student.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
      await Department.destroy({ where: {}, force: true });
    });

    it('should require studentNumber', async () => {
      await expect(
        Student.create({
          userId: user.id,
          departmentId: department.id,
          enrollmentYear: 2024
        })
      ).rejects.toThrow();
    });

    it('should have unique studentNumber', async () => {
      const student1 = await Student.create({
        userId: user.id,
        studentNumber: 'UNIQUE001',
        departmentId: department.id,
        enrollmentYear: 2024
      });

      const user2 = await User.create({
        email: 'student2@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student2',
        role: 'student'
      });

      await expect(
        Student.create({
          userId: user2.id,
          studentNumber: 'UNIQUE001',
          departmentId: department.id,
          enrollmentYear: 2024
        })
      ).rejects.toThrow();

      await student1.destroy({ force: true });
      await user2.destroy({ force: true });
    });
  });

  describe('Faculty Model', () => {
    let department;
    let user;

    beforeEach(async () => {
      department = await Department.create({
        name: 'Test Department',
        code: 'TEST',
        isActive: true
      });

      user = await User.create({
        email: 'faculty@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Faculty',
        role: 'faculty'
      });
    });

    afterEach(async () => {
      await Faculty.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
      await Department.destroy({ where: {}, force: true });
    });


    it('should require employeeNumber', async () => {
      await expect(
        Faculty.create({
          userId: user.id,
          departmentId: department.id,
          title: 'Professor'
        })
      ).rejects.toThrow();
    });

  });

  describe('Model Associations', () => {
    it('should have User-Student association', async () => {
      const department = await Department.create({
        name: 'Test Department',
        code: 'TEST',
        isActive: true
      });

      const user = await User.create({
        email: 'assoc@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      });

      const student = await Student.create({
        userId: user.id,
        studentNumber: 'ASSOC001',
        departmentId: department.id,
        enrollmentYear: 2024
      });

      // Test association
      const userWithStudent = await User.findByPk(user.id, {
        include: [{ model: Student, as: 'studentProfile' }]
      });

      expect(userWithStudent).toBeDefined();
      expect(userWithStudent.studentProfile).toBeDefined();

      await student.destroy({ force: true });
      await user.destroy({ force: true });
      await department.destroy({ force: true });
    });

  });
});

