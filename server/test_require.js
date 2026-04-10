const fs = require('fs');
const results = [];

const modules = [
  ['express', () => require('express')],
  ['cors', () => require('cors')],
  ['dotenv', () => require('dotenv')],
  ['cookie-parser', () => require('cookie-parser')],
  ['config/db', () => require('./config/db')],
  ['routes/authroutes', () => require('./routes/authroutes')],
  ['routes/adminroutes', () => require('./routes/adminroutes')],
  ['controllers/medicinecontroller', () => require('./controllers/medicinecontroller')],
  ['routes/medicineroutes', () => require('./routes/medicineroutes')],
  ['controllers/vendorcontroller', () => require('./controllers/vendorcontroller')],
  ['routes/vendorroutes', () => require('./routes/vendorroutes')],
  ['controllers/prescriptioncontroller', () => require('./controllers/prescriptioncontroller')],
  ['routes/prescriptionroutes', () => require('./routes/prescriptionroutes')],
  ['models/User', () => require('./models/User')],
  ['models/Medicine', () => require('./models/Medicine')],
  ['models/Inventory', () => require('./models/Inventory')],
  ['models/Prescription', () => require('./models/Prescription')],
  ['groq-sdk', () => require('groq-sdk')],
];

for (const [name, fn] of modules) {
  try {
    fn();
    results.push('OK: ' + name);
  } catch (e) {
    results.push('FAIL: ' + name + ' - ' + e.message.substring(0, 200));
    results.push('  Stack: ' + (e.stack || '').split('\n').slice(0, 3).join(' | '));
  }
}

fs.writeFileSync('test_results.txt', results.join('\n'), 'utf8');
console.log('Results written to test_results.txt');
