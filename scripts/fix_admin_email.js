const { sequelize, User } = require('../src/models');

async function fixAdminEmail() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find admin with unicode email
        const unicodeAdmin = await User.findOne({ where: { email: 'admin@kampüs.edu.tr' } });

        if (unicodeAdmin) {
            console.log('Found unicode admin, updating...');
            unicodeAdmin.email = 'admin@kampus.edu.tr';
            await unicodeAdmin.save();
            console.log('Admin email updated to: admin@kampus.edu.tr');
        } else {
            console.log('Unicode admin not found. Checking for ASCII admin...');
            const asciiAdmin = await User.findOne({ where: { email: 'admin@kampus.edu.tr' } });
            if (asciiAdmin) {
                console.log('ASCII admin already exists.');
            } else {
                console.log('No admin found. You might need to run the seeder or create_admin script.');
            }
        }

    } catch (error) {
        console.error('Error fixing admin:', error);
    } finally {
        await sequelize.close();
    }
}

fixAdminEmail();
