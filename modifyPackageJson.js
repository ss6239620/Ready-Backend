const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Path to the package.json file
const packageJsonPath = path.join(__dirname, 'package.json');

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check if NODE_ENV is set to production
const isProduction = process.env.NODE_ENV === 'production';
console.log(process.env.NODE_ENV);


if (isProduction) {
  // Add the "engines" field if NODE_ENV is 'production'
  packageJson.engines = { node: '16.14.2' };
} else {
  // Remove the "engines" field if NODE_ENV is not 'production'
  delete packageJson.engines;
}

// Write the modified package.json back to the file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

console.log(`package.json updated for ${isProduction ? 'production' : 'development'} environment.`);
