console.log('Checking imports...');
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '../.env') }); console.log('dotenv ok'); } catch (e) { console.log('dotenv missing'); }
try { require('bcryptjs'); console.log('bcryptjs ok'); } catch (e) { console.log('bcryptjs missing'); }
try { require('../src/models'); console.log('models ok'); } catch (e) { console.log('models missing:', e.message); }
