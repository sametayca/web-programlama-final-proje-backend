const { sequelize, User } = require('../src/models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const adminEmail = 'admin@kampus.edu.tr';
    const adminPassword = 'Password123';

    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      // Ensure role is admin
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('Updated existing user to admin role.');
      }
      process.exit(0);
    }

    // Create Admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail,
      password: hashedPassword, // Model hook might re-hash if not careful, but usually simple create passes raw if hook handles it. 
      // Wait, User model hooks: beforeCreate hashes the password. So I should pass raw password?
      // Let's check User.js again. lines 84-88: if (user.password) user.password = await bcrypt.hash...
      // So I should pass raw password.
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });
    
    // Actually, let's pass the raw password and let the hook handle hash to be safe/consistent
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await sequelize.close();
  }
}

// Rewriting with raw password to rely on hook logic seen in User.js
async function createAdminSafe() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const adminEmail = 'admin@kampus.edu.tr';
    const rawPassword = 'Password123';

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('User role updated to admin.');
      }
      return;
    }

    await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail,
      password: rawPassword, // Hooks will hash this
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
      phone: '5551234567'
    });

    console.log('Admin user created successfully.');
    console.log('Email:', adminEmail);
    console.log('Password:', rawPassword);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

createAdminSafe();
