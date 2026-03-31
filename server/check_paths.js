const fs = require('fs');
const path = require('path');

console.log('Current Directory:', process.cwd());
console.log('__dirname:', __dirname);

const modelsDir = path.join(__dirname, 'models');
console.log('Models Directory exists:', fs.existsSync(modelsDir));

if (fs.existsSync(modelsDir)) {
  console.log('Files in models:', fs.readdirSync(modelsDir));
  
  const leadPath = path.join(modelsDir, 'Lead.js');
  console.log('Lead.js exists at', leadPath, ':', fs.existsSync(leadPath));
  
  try {
    console.log('Trying to require("./models/Lead.js"):');
    const Lead = require('./models/Lead.js');
    console.log('Lead loaded successfully!');
  } catch (e) {
    console.error('require failed:', e);
  }
}
